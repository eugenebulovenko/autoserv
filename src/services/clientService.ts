import { supabase } from '@/lib/supabase';
import { Client, Vehicle, ServiceHistory, LoyaltyOffer } from '@/types/client';

export const clientService = {
  // Клиенты
  async getClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Client[];
  },

  async getClientById(id: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Client;
  },

  async createClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select()
      .single();
    
    if (error) throw error;
    return data as Client;
  },

  async updateClient(id: string, client: Partial<Client>) {
    const { data, error } = await supabase
      .from('clients')
      .update(client)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Client;
  },

  async deleteClient(id: string) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Автомобили
  async getClientVehicles(clientId: string) {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Vehicle[];
  },

  async addVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('vehicles')
      .insert([vehicle])
      .select()
      .single();
    
    if (error) throw error;
    return data as Vehicle;
  },

  // История обслуживания
  async getVehicleServiceHistory(vehicleId: string) {
    const { data, error } = await supabase
      .from('service_history')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('service_date', { ascending: false });
    
    if (error) throw error;
    return data as ServiceHistory[];
  },

  async addServiceHistory(history: Omit<ServiceHistory, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('service_history')
      .insert([history])
      .select()
      .single();
    
    if (error) throw error;
    return data as ServiceHistory;
  },

  // Программа лояльности
  async getClientOffers(clientId: string) {
    const { data, error } = await supabase
      .from('loyalty_offers')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as LoyaltyOffer[];
  },

  async createOffer(offer: Omit<LoyaltyOffer, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('loyalty_offers')
      .insert([offer])
      .select()
      .single();
    
    if (error) throw error;
    return data as LoyaltyOffer;
  },

  async updateOffer(id: string, offer: Partial<LoyaltyOffer>) {
    const { data, error } = await supabase
      .from('loyalty_offers')
      .update(offer)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as LoyaltyOffer;
  },

  async deleteOffer(id: string) {
    const { error } = await supabase
      .from('loyalty_offers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
}; 