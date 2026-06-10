const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchCareerSignals() {
  await wait(450);
  return {
    atsTrend: [
      { day: 'Mon', score: 71 },
      { day: 'Tue', score: 74 },
      { day: 'Wed', score: 76 },
      { day: 'Thu', score: 79 },
      { day: 'Fri', score: 81 },
      { day: 'Sat', score: 82 },
      { day: 'Sun', score: 84 },
    ],
    funnel: [
      { stage: 'Wishlist', value: 34 },
      { stage: 'Applied', value: 22 },
      { stage: 'HR', value: 9 },
      { stage: 'Tech', value: 5 },
      { stage: 'Offer', value: 2 },
    ],
    marketDemand: [
      { skill: 'ERwin', demand: 78 },
      { skill: 'Data Vault', demand: 71 },
      { skill: 'Synapse', demand: 84 },
      { skill: 'ADF', demand: 88 },
      { skill: 'SQL', demand: 92 },
      { skill: 'Power BI', demand: 76 },
    ],
    recommendations: [
      'Prioritize ERwin + Data Vault keywords in next 20 applications.',
      'Your best conversion channel this week: LinkedIn Easy Apply.',
      'Add one quantified architecture impact point in resume headline.',
      'Target hybrid roles in Bangalore + Pune for salary range 17–20 LPA.',
    ],
  };
}

export async function fetchInterviewDeck() {
  await wait(300);
  return [
    'Explain SCD Type 2 implementation with surrogate keys.',
    'Difference between OLTP and OLAP in architecture decisions.',
    'How to model bridge tables in many-to-many dimensions?',
    'Design Azure ETL pipeline with CDC and late arriving dimensions.',
  ];
}

