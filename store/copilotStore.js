import { create } from 'zustand';

const defaultBoard = {
  wishlist: ['HDFC Bank - Senior Data Modeler', 'Infosys - Azure Data Architect'],
  applied: ['Accenture - Data Architect', 'Genpact - Data Modeler'],
  hr: ['Wipro - DW Architect'],
  technical: ['Cognizant - Data Modeler'],
  managerial: [],
  offer: [],
  rejected: [],
};

export const useCopilotStore = create((set, get) => ({
  activePanel: 'overview',
  commandOpen: false,
  board: defaultBoard,
  notifications: [
    { id: 1, type: 'success', text: 'ATS score improved to 84%' },
    { id: 2, type: 'info', text: '3 new ERwin-matching roles found' },
  ],
  setActivePanel: (activePanel) => set({ activePanel }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  moveCard: (from, to, card) => {
    const current = get().board;
    if (!from || !to || !card) return;
    set({
      board: {
        ...current,
        [from]: current[from].filter((x) => x !== card),
        [to]: [card, ...current[to]],
      },
    });
  },
  addNotification: (text, type = 'info') => {
    const next = {
      id: Date.now(),
      text,
      type,
    };
    set((s) => ({ notifications: [next, ...s.notifications].slice(0, 8) }));
  },
}));

