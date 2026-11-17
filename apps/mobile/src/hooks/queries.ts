import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api } from '@/services/api';
import { useSession } from '@/stores/session';
import type { Address, Catalog, Product, Variant } from '@/types';

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 2 }, mutations: { retry: 0 } },
});

export function useCatalog() {
  const q = useQuery({ queryKey: ['catalog'], queryFn: api.catalog });
  const data = q.data;
  const maps = useMemo(() => {
    const c: Catalog | undefined = data;
    return {
      productsById: new Map<string, Product>((c?.products ?? []).map((p) => [p.id, p])),
      variantsById: new Map<string, Variant>((c?.variants ?? []).map((v) => [v.id, v])),
      activeProducts: (c?.products ?? []).filter((p) => p.isActive !== false),
    };
  }, [data]);
  return { ...q, catalog: data, ...maps };
}

export function useAddresses() {
  const signedIn = useSession((s) => !!s.session);
  return useQuery({ queryKey: ['addresses'], queryFn: api.addresses, enabled: signedIn });
}

export function useSaveAddress() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (a: Address) => api.saveAddress(a), onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }) });
}

export function useMyOrders() {
  const signedIn = useSession((s) => !!s.session);
  return useQuery({ queryKey: ['orders', 'mine'], queryFn: api.myOrders, enabled: signedIn });
}

export function useOrder(id: string) {
  return useQuery({ queryKey: ['order', id], queryFn: () => api.order(id), refetchInterval: 20_000 });
}

/** Refresh everything that depends on orders and stock after a change. */
export function invalidateOrders(qc = queryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ['orders'] }),
    qc.invalidateQueries({ queryKey: ['order'] }),
    qc.invalidateQueries({ queryKey: ['admin'] }),
    qc.invalidateQueries({ queryKey: ['catalog'] }),
  ]);
}

export function useAdminOrders() {
  return useQuery({ queryKey: ['admin', 'orders'], queryFn: api.adminOrders, refetchInterval: 20_000 });
}
export function useAdminDashboard() {
  return useQuery({ queryKey: ['admin', 'dashboard'], queryFn: api.adminDashboard, refetchInterval: 30_000 });
}
