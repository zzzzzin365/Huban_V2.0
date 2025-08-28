import {create} from 'zustand';
import {Volunteer, HelpRequest, Location} from '../types';

interface VolunteerState {
  // 状态
  volunteers: Volunteer[];
  helpRequests: HelpRequest[];
  currentLocation: Location | null;
  isLoading: boolean;
  error: string | null;
  
  // 操作
  setVolunteers: (volunteers: Volunteer[]) => void;
  addVolunteer: (volunteer: Volunteer) => void;
  updateVolunteer: (id: string, updates: Partial<Volunteer>) => void;
  removeVolunteer: (id: string) => void;
  
  setHelpRequests: (requests: HelpRequest[]) => void;
  addHelpRequest: (request: HelpRequest) => void;
  updateHelpRequest: (id: string, updates: Partial<HelpRequest>) => void;
  removeHelpRequest: (id: string) => void;
  
  setCurrentLocation: (location: Location) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 计算属性
  getNearbyVolunteers: (radius: number) => Volunteer[];
  getVolunteersBySkill: (skill: string) => Volunteer[];
  getHelpRequestsByStatus: (status: HelpRequest['status']) => HelpRequest[];
  getUrgentRequests: () => HelpRequest[];
}

export const useVolunteerStore = create<VolunteerState>((set, get) => ({
  // 初始状态
  volunteers: [],
  helpRequests: [],
  currentLocation: null,
  isLoading: false,
  error: null,
  
  // 志愿者操作
  setVolunteers: (volunteers) => set({volunteers}),
  addVolunteer: (volunteer) => 
    set((state) => ({volunteers: [...state.volunteers, volunteer]})),
  updateVolunteer: (id, updates) =>
    set((state) => ({
      volunteers: state.volunteers.map(v => 
        v.id === id ? {...v, ...updates} : v
      )
    })),
  removeVolunteer: (id) =>
    set((state) => ({
      volunteers: state.volunteers.filter(v => v.id !== id)
    })),
  
  // 求助请求操作
  setHelpRequests: (requests) => set({helpRequests: requests}),
  addHelpRequest: (request) =>
    set((state) => ({helpRequests: [...state.helpRequests, request]})),
  updateHelpRequest: (id, updates) =>
    set((state) => ({
      helpRequests: state.helpRequests.map(r =>
        r.id === id ? {...r, ...updates} : r
      )
    })),
  removeHelpRequest: (id) =>
    set((state) => ({
      helpRequests: state.helpRequests.filter(r => r.id !== id)
    })),
  
  // 位置和状态操作
  setCurrentLocation: (location) => set({currentLocation: location}),
  setLoading: (loading) => set({isLoading: loading}),
  setError: (error) => set({error}),
  
  // 计算属性
  getNearbyVolunteers: (radius) => {
    const {volunteers, currentLocation} = get();
    if (!currentLocation) return [];
    
    return volunteers.filter(volunteer => {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        volunteer.location.latitude,
        volunteer.location.longitude
      );
      return distance <= radius;
    });
  },
  
  getVolunteersBySkill: (skill) => {
    const {volunteers} = get();
    return volunteers.filter(v => v.skills.includes(skill));
  },
  
  getHelpRequestsByStatus: (status) => {
    const {helpRequests} = get();
    return helpRequests.filter(r => r.status === status);
  },
  
  getUrgentRequests: () => {
    const {helpRequests} = get();
    return helpRequests.filter(r => 
      r.urgency === 'high' || r.urgency === 'emergency'
    );
  },
}));

// 计算两点间距离的辅助函数
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
