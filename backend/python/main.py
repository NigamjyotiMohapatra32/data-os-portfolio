"""
Data OS Portfolio — Python FastAPI Microservice  v2.0
Enterprise backend powering resume analysis, job matching,
SQL tooling, email delivery, and ER diagram DDL generation.

Deploy: Railway / Render / Vercel (see railway.json / render.yaml)
Docs:   GET /api/docs  (Swagger UI)
Health: GET /api/health
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Dict, Any
import uvicorn
import os
import time
import logging
import re
import json
import smtplib
import email.mime.multipart
import email.mime.text
from datetime import datetime
from io import BytesIO
from collections import Counter

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("data-os-api")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Data OS Portfolio API",
    description="Enterprise microservice: resume analysis, job matching, SQL tools, email.",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = [
    "https://nigamjyoti.netlify.app",
    "http://localhost:3000",
    "http://localhost:4000",
    os.getenv("EXTRA_ORIGIN", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in ALLOWED_ORIGINS if o],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ── Request timing middleware ─────────────────────────────────────────────────
@app.middleware("http")
async def add_timing(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    ms = round((time.perf_counter() - start) * 1000, 2)
    response.headers["X-Process-Time-Ms"] = str(ms)
    log.info(f"{request.method} {request.url.path} → {response.status_code} ({ms}ms)")
    return response


# ═════════════════════════════════════════════════════════════════════════════
# DATA SCIENCE KEYWORD LIBRARY
# ═════════════════════════════════════════════════════════════════════════════
DATA_SKILLS = {
    "modeling": [
        "dimensional modeling", "star schema", "snowflake schema", "data vault",
        "kimball", "inmon", "3nf", "data modeling", "er diagram", "erd",
        "entity relationship", "scd type 1", "scd type 2", "scd type 3",
        "slowly changing dimension", "conformed dimension", "fact table",
        "dimension table", "olap", "oltp", "data warehouse", "dwh", "edw",
        "erwin", "er studio", "idef1x", "logical model", "physical model",
        "conceptual model", "source to target", "s2t mapping",
    ],
    "sql": [
        "sql", "t-sql", "pl/sql", "sql server", "postgresql", "mysql", "oracle",
        "db2", "redshift", "bigquery", "snowflake", "databricks", "hive",
        "stored procedure", "trigger", "cte", "window function", "partition by",
        "rank", "row_number", "lag", "lead", "pivot", "unpivot", "merge",
        "upsert", "index", "execution plan", "query optimisation",
        "query optimization", "performance tuning", "temp table", "view",
    ],
    "etl": [
        "etl", "elt", "data pipeline", "data ingestion", "adf",
        "azure data factory", "ssis", "informatica", "talend", "pentaho",
        "apache spark", "pyspark", "kafka", "airflow", "dbt",
        "data lineage", "data quality", "data cleansing", "data transformation",
        "batch processing", "stream processing", "real-time", "incremental load",
        "full load", "cdc", "change data capture",
    ],
    "cloud": [
        "azure", "aws", "gcp", "google cloud", "databricks", "synapse",
        "azure synapse", "azure sql", "cosmos db", "blob storage", "s3",
        "glue", "emr", "redshift", "bigquery", "dataflow",
        "terraform", "docker", "kubernetes", "ci/cd", "devops",
    ],
    "bi": [
        "power bi", "tableau", "looker", "qlik", "ssrs", "ssis",
        "dax", "mdx", "kpi", "dashboard", "report", "data visualisation",
        "data visualization", "business intelligence",
    ],
    "soft": [
        "agile", "scrum", "jira", "confluence", "stakeholder", "requirements",
        "documentation", "collaboration", "communication", "leadership",
        "problem solving", "analytical", "attention to detail",
    ],
}

ALL_SKILLS_FLAT = {skill for skills in DATA_SKILLS.values() for skill in skills}


# ═════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═════════════════════════════════════════════════════════════════════════════

def normalise(text: str) -> str:
    """Lowercase, collapse whitespace."""
    return re.sub(r"\s+", " ", text.lower().strip())


def extract_text_from_pdf(data: bytes) -> str:
    """Extract text from PDF bytes without heavy dependencies."""
    try:
        import pdfplumber
        with pdfplumber.open(BytesIO(data)) as pdf:
            return "\n".join(p.extract_text() or "" for p in pdf.pages)
    except ImportError:
        pass
    # Fallback: naive byte scan for printable ASCII (works for simple PDFs)
    text = data.decode("latin-1", errors="ignore")
    printable = re.sub(r"[^\x20-\x7E\n]", " ", text)
    return re.sub(r" {4,}", " ", printable)


def extract_text_from_docx(data: bytes) -> str:
    """Extract text from DOCX bytes."""
    try:
        from docx import Document
        doc = Document(BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs)
    except ImportError:
        # Fallback: unzip and grab XML text
        import zipfile
        try:
            with zipfile.ZipFile(BytesIO(data)) as z:
                with z.open("word/document.xml") as f:
                    xml = f.read().decode("utf-8", errors="ignore")
            return re.sub(r"<[^>]+>", " ", xml)
        except Exception:
            return ""


def score_resume(text: str, job_desc: str = "") -> dict:
    """
    Analyse resume text and optionally a job description.
    Returns structured scoring, matched/missing skills, and suggestions.
    """
    norm = normalise(text)
    job_norm = normalise(job_desc) if job_desc else ""

    # ── Skill extraction ──────────────────────────────────────────────────────
    matched: Dict[str, List[str]] = {}
    missing: List[str] = []

    for category, skills in DATA_SKILLS.items():
        found = [s for s in skills if s in norm]
        matched[category] = found

    # ── Years of experience ───────────────────────────────────────────────────
    years_patterns = [
        r"(\d+)\+?\s*years?\s+(?:of\s+)?experience",
        r"(\d+)\+?\s*yrs?\s+(?:of\s+)?experience",
        r"experience\s+of\s+(\d+)\+?\s*years?",
    ]
    years = 0
    for pat in years_patterns:
        m = re.search(pat, norm)
        if m:
            years = max(years, int(m.group(1)))

    # ── ATS score (0-100) ─────────────────────────────────────────────────────
    total_possible = len(ALL_SKILLS_FLAT)
    total_found = sum(len(v) for v in matched.values())
    base_score = min(100, round((total_found / max(total_possible, 1)) * 200))  # weighted

    # Bonus: years of experience
    exp_bonus = min(15, years * 3)
    # Bonus: contact info
    contact_bonus = 5 if re.search(r"[\w.+-]+@[\w-]+\.\w+", norm) else 0
    # Bonus: education
    edu_bonus = 5 if any(kw in norm for kw in ["bachelor", "master", "b.tech", "m.tech", "degree", "mba"]) else 0

    ats_score = min(100, base_score + exp_bonus + contact_bonus + edu_bonus)

    # ── Job match (if desc provided) ──────────────────────────────────────────
    job_match = None
    if job_norm:
        job_keywords = set()
        for s in ALL_SKILLS_FLAT:
            if s in job_norm:
                job_keywords.add(s)

        resume_keywords = set()
        for skills in matched.values():
            resume_keywords.update(skills)

        if job_keywords:
            matched_jd = job_keywords & resume_keywords
            missing_jd = job_keywords - resume_keywords
            job_match = {
                "score": round(len(matched_jd) / len(job_keywords) * 100),
                "matched": sorted(matched_jd),
                "missing": sorted(missing_jd)[:10],
            }

    # ── Suggestions ───────────────────────────────────────────────────────────
    suggestions = []
    if not matched.get("cloud"):
        suggestions.append("Add cloud platform experience (Azure, AWS, or GCP).")
    if not matched.get("etl"):
        suggestions.append("Mention ETL/ELT tools (ADF, SSIS, Airflow, dbt).")
    if len(matched.get("sql", [])) < 3:
        suggestions.append("Expand SQL section: add window functions, CTEs, performance tuning.")
    if years == 0:
        suggestions.append("State total years of experience explicitly.")
    if ats_score < 50:
        suggestions.append("Add more domain-specific keywords matching the job description.")

    return {
        "ats_score": ats_score,
        "years_experience": years,
        "skills_matched": matched,
        "total_skills_found": total_found,
        "suggestions": suggestions,
        "job_match": job_match,
    }


def format_sql_query(sql: str) -> str:
    """Format SQL using sqlparse if available, otherwise basic formatting."""
    try:
        import sqlparse
        return sqlparse.format(
            sql,
            reindent=True,
            keyword_uppercased=True,
            indent_width=2,
            strip_comments=False,
            use_space_around_operators=True,
        )
    except ImportError:
        # Basic formatter: uppercase keywords
        keywords = [
            "SELECT", "FROM", "WHERE", "JOIN", "LEFT JOIN", "RIGHT JOIN",
            "INNER JOIN", "OUTER JOIN", "GROUP BY", "ORDER BY", "HAVING",
            "INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP",
            "WITH", "UNION", "ALL", "DISTINCT", "ON", "AND", "OR",
            "AS", "SET", "VALUES", "INTO", "EXISTS", "CASE", "WHEN",
            "THEN", "ELSE", "END", "LIMIT", "OFFSET", "RETURNING",
        ]
        result = sql
        for kw in keywords:
            result = re.sub(rf"\b{kw}\b", kw, result, flags=re.IGNORECASE)
        return result


def generate_ddl(entities: List[dict], dialect: str = "sqlserver") -> str:
    """Generate SQL DDL from ER diagram entity JSON."""
    lines = [
        f"-- DDL Generated by Data OS Portfolio API",
        f"-- Dialect: {dialect.upper()}",
        f"-- Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC",
        "",
    ]

    type_map = {
        "sqlserver": {"INT": "INT", "VARCHAR": "NVARCHAR", "DATE": "DATE", "BOOL": "BIT",
                      "FLOAT": "FLOAT", "TEXT": "NVARCHAR(MAX)", "TIMESTAMP": "DATETIME2"},
        "postgresql": {"INT": "INTEGER", "VARCHAR": "VARCHAR", "DATE": "DATE", "BOOL": "BOOLEAN",
                       "FLOAT": "NUMERIC", "TEXT": "TEXT", "TIMESTAMP": "TIMESTAMP"},
        "mysql":      {"INT": "INT", "VARCHAR": "VARCHAR", "DATE": "DATE", "BOOL": "TINYINT(1)",
                       "FLOAT": "DECIMAL", "TEXT": "TEXT", "TIMESTAMP": "DATETIME"},
    }
    types = type_map.get(dialect.lower(), type_map["sqlserver"])

    for entity in entities:
        tbl = entity.get("name", "unnamed_table")
        attrs = entity.get("attributes", [])

        lines.append(f"CREATE TABLE {tbl} (")
        col_lines = []
        pk_cols = []

        for attr in attrs:
            aname = attr.get("name", "col")
            atype_raw = attr.get("type", "VARCHAR").upper()
            atype = types.get(atype_raw, atype_raw)
            is_pk = attr.get("isPrimary", False)
            is_fk = attr.get("isForeign", False)
            nullable = "" if attr.get("notNull", is_pk) else " NULL"

            if "VARCHAR" in atype and "(" not in atype:
                atype += "(255)"

            col_def = f"    {aname} {atype}{nullable}"
            if is_pk:
                pk_cols.append(aname)
            if is_fk:
                col_def += "  -- FK"
            col_lines.append(col_def)

        lines.append(",\n".join(col_lines))

        if pk_cols:
            lines[-1] += ","
            lines.append(f"    CONSTRAINT PK_{tbl} PRIMARY KEY ({', '.join(pk_cols)})")

        lines.append(");")
        lines.append("")

    return "\n".join(lines)


# ═════════════════════════════════════════════════════════════════════════════
# REQUEST / RESPONSE MODELS
# ═════════════════════════════════════════════════════════════════════════════

class EmailRequest(BaseModel):
    from_name: str
    from_email: EmailStr
    message: str
    to_name: str = "Nigamjyoti"

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v):
        if len(v.strip()) < 10:
            raise ValueError("Message must be at least 10 characters")
        return v.strip()

    @field_validator("from_name")
    @classmethod
    def name_not_empty(cls, v):
        if len(v.strip()) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v.strip()


class SQLFormatRequest(BaseModel):
    sql: str
    dialect: str = "sqlserver"


class DDLRequest(BaseModel):
    entities: List[Dict[str, Any]]
    dialect: str = "sqlserver"


class JobMatchRequest(BaseModel):
    resume_text: str
    job_description: str


# ═════════════════════════════════════════════════════════════════════════════
# ROUTES
# ═════════════════════════════════════════════════════════════════════════════

# ── Health ─────────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["System"])
async def health():
    """Service health check."""
    return {
        "status": "ok",
        "version": "2.0.0",
        "service": "Data OS Portfolio API",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


# ── Resume analysis ─────────────────────────────────────────────────────────
@app.post("/api/resume/analyze", tags=["Resume"])
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = "",
):
    """
    Parse a resume PDF or DOCX and return:
    - ATS compatibility score (0-100)
    - Matched skills by category
    - Years of experience
    - Suggestions for improvement
    - Optional job-description match score
    """
    MAX_SIZE = 10 * 1024 * 1024  # 10 MB
    data = await file.read()

    if len(data) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    filename = (file.filename or "").lower()
    content_type = (file.content_type or "").lower()

    if filename.endswith(".pdf") or "pdf" in content_type:
        text = extract_text_from_pdf(data)
    elif filename.endswith((".docx", ".doc")) or "word" in content_type:
        text = extract_text_from_docx(data)
    else:
        raise HTTPException(status_code=415, detail="Unsupported file type. Send PDF or DOCX.")

    if len(text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Could not extract text from file. Ensure it is not a scanned image.")

    result = score_resume(text, job_description)
    return {
        "ok": True,
        "filename": file.filename,
        "characters_extracted": len(text),
        **result,
    }


@app.post("/api/resume/match-job", tags=["Resume"])
async def match_job(req: JobMatchRequest):
    """Score a resume text against a job description (no file upload needed)."""
    result = score_resume(req.resume_text, req.job_description)
    return {"ok": True, **result}


# ── SQL tools ───────────────────────────────────────────────────────────────
@app.post("/api/sql/format", tags=["SQL Tools"])
async def sql_format(req: SQLFormatRequest):
    """Format and prettify a SQL query."""
    if not req.sql.strip():
        raise HTTPException(status_code=400, detail="SQL cannot be empty")
    formatted = format_sql_query(req.sql)
    return {"ok": True, "formatted": formatted, "dialect": req.dialect}


@app.post("/api/sql/validate", tags=["SQL Tools"])
async def sql_validate(req: SQLFormatRequest):
    """Basic SQL syntax validation (keyword + structure check)."""
    sql = req.sql.strip()
    if not sql:
        raise HTTPException(status_code=400, detail="SQL cannot be empty")

    issues = []
    norm = sql.lower()

    # Basic checks
    if norm.count("(") != norm.count(")"):
        issues.append("Unbalanced parentheses detected.")
    if re.search(r"\bselect\b", norm) and not re.search(r"\bfrom\b", norm):
        issues.append("SELECT statement is missing a FROM clause.")
    if re.search(r"\binsert\b", norm) and not re.search(r"\binto\b", norm):
        issues.append("INSERT statement is missing INTO.")
    if re.search(r"\bupdate\b", norm) and not re.search(r"\bset\b", norm):
        issues.append("UPDATE statement is missing SET clause.")
    if re.search(r"\bjoin\b", norm) and not re.search(r"\bon\b", norm):
        issues.append("JOIN found without an ON condition.")
    if re.search(r"'\s*'", norm):
        issues.append("Empty string literal detected — intentional?")

    # Detect dangerous operations
    danger = []
    if re.search(r"\bdrop\s+table\b", norm):
        danger.append("DROP TABLE detected — destructive operation.")
    if re.search(r"\btruncate\b", norm):
        danger.append("TRUNCATE detected — all rows will be deleted.")
    if re.search(r"\bdelete\b.*\bwhere\b", norm) is None and re.search(r"\bdelete\b", norm):
        danger.append("DELETE without WHERE — all rows would be affected.")

    return {
        "ok": True,
        "valid": len(issues) == 0 and len(danger) == 0,
        "issues": issues,
        "warnings": danger,
        "line_count": sql.count("\n") + 1,
        "statement_count": len([s for s in re.split(r";", sql) if s.strip()]),
    }


# ── ER Diagram → DDL ────────────────────────────────────────────────────────
@app.post("/api/er/generate-ddl", tags=["ER Diagram"])
async def er_to_ddl(req: DDLRequest):
    """Convert ER diagram entity JSON to SQL DDL (SQL Server, PostgreSQL, MySQL)."""
    if not req.entities:
        raise HTTPException(status_code=400, detail="No entities provided")
    if len(req.entities) > 50:
        raise HTTPException(status_code=400, detail="Too many entities (max 50)")

    valid_dialects = {"sqlserver", "postgresql", "mysql"}
    if req.dialect.lower() not in valid_dialects:
        raise HTTPException(status_code=400, detail=f"Dialect must be one of: {', '.join(valid_dialects)}")

    ddl = generate_ddl(req.entities, req.dialect)
    return {"ok": True, "ddl": ddl, "dialect": req.dialect, "tables": len(req.entities)}


# ── Email ────────────────────────────────────────────────────────────────────
@app.post("/api/contact/send", tags=["Contact"])
async def send_email(req: EmailRequest, background_tasks: BackgroundTasks):
    """Send contact form email via SMTP (Gmail app password)."""
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")
    contact_to = os.getenv("CONTACT_TO", smtp_user)

    if not smtp_user or not smtp_pass:
        # Graceful degradation — log and return OK (Firestore still stores it)
        log.warning("SMTP not configured — email skipped, Firestore still receives submission")
        return {"ok": True, "method": "firestore_only"}

    def _send():
        try:
            msg = email.mime.multipart.MIMEMultipart("alternative")
            msg["Subject"] = f"Portfolio Contact: {req.from_name}"
            msg["From"] = smtp_user
            msg["To"] = contact_to
            msg["Reply-To"] = req.from_email

            html = f"""
            <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0c1322;color:#e2e8f0;border-radius:12px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#22d3ee20,#a78bfa20);padding:24px 32px;border-bottom:1px solid #1f2a44;">
                <h2 style="margin:0;color:#22d3ee;">📬 New Portfolio Message</h2>
              </div>
              <div style="padding:32px;">
                <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">From</p>
                <p style="margin:0 0 24px;font-size:16px;font-weight:600;">{req.from_name} &lt;{req.from_email}&gt;</p>
                <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Message</p>
                <p style="margin:0;line-height:1.7;background:#111a2e;padding:16px;border-radius:8px;border-left:3px solid #22d3ee;">{req.message}</p>
              </div>
              <div style="padding:16px 32px;border-top:1px solid #1f2a44;color:#475569;font-size:11px;">
                Sent via Data OS Portfolio · {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}
              </div>
            </div>
            """
            msg.attach(email.mime.text.MIMEText(html, "html"))

            with smtplib.SMTP(smtp_host, smtp_port) as s:
                s.ehlo()
                s.starttls()
                s.login(smtp_user, smtp_pass)
                s.sendmail(smtp_user, contact_to, msg.as_string())

            log.info(f"Email sent to {contact_to} from {req.from_email}")
        except Exception as exc:
            log.error(f"Email send failed: {exc}")

    background_tasks.add_task(_send)
    return {"ok": True, "method": "smtp_queued"}


# ── Skills API ───────────────────────────────────────────────────────────────
@app.get("/api/skills/categories", tags=["Skills"])
async def get_skill_categories():
    """Return the full skill taxonomy used for resume analysis."""
    return {
        "ok": True,
        "categories": {k: len(v) for k, v in DATA_SKILLS.items()},
        "total_skills": len(ALL_SKILLS_FLAT),
    }


# ═════════════════════════════════════════════════════════════════════════════
# EXCEPTION HANDLERS
# ═════════════════════════════════════════════════════════════════════════════
@app.exception_handler(Exception)
async def global_handler(request: Request, exc: Exception):
    log.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"ok": False, "error": "Internal server error", "detail": str(exc)},
    )


# ═════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=os.getenv("DEV") == "1")
