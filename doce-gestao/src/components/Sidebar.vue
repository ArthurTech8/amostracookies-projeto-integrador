<script setup lang="ts">
import type { Section } from '../types'
import { LayoutDashboard, Package, PlusCircle, ReceiptText, ShoppingCart, ChartNoAxesCombined, CakeSlice, Lock, Users, Boxes } from 'lucide-vue-next'

defineProps<{ current: Section; canEnter: (section: Section) => boolean; isAdmin: boolean }>()
const emit = defineEmits<{ navigate: [section: Section] }>()
const links: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'products', label: 'Produtos', icon: Package },
  { id: 'stock', label: 'Estoque', icon: Boxes },
  { id: 'product-form', label: 'Cadastrar produto', icon: PlusCircle },
  { id: 'expenses', label: 'Despesas', icon: ReceiptText },
  { id: 'sales', label: 'Vendas', icon: ShoppingCart },
  { id: 'reports', label: 'Relatórios', icon: ChartNoAxesCombined },
  { id: 'team', label: 'Equipe e acessos', icon: Users },
]
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-icon"><CakeSlice :size="23" /></div>
      <div><strong>doce<span>gestão</span></strong><small>PAINEL DA CONFEITARIA</small></div>
    </div>
    <p class="nav-caption">MENU PRINCIPAL</p>
    <nav>
      <button v-for="link in links.filter(link => link.id !== 'team' || isAdmin)" :key="link.id" class="nav-link" :class="{ active: current === link.id || (current === 'product-form' && link.id === 'product-form') }" @click="emit('navigate', link.id)">
        <component :is="link.icon" :size="19" :stroke-width="1.8" />
        <span>{{ link.label }}</span>
        <Lock v-if="!canEnter(link.id)" :size="15" aria-label="Acesso restrito" />
      </button>
    </nav>
    <div class="sidebar-note">
      <div class="note-icon">♡</div>
      <strong>Feito com carinho</strong>
      <p>Organize sua confeitaria e acompanhe cada conquista.</p>
    </div>
    <div class="sidebar-footer">Doce Gestão <span>•</span> v1.0</div>
  </aside>
</template>