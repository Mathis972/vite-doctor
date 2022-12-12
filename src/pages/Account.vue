<script setup lang="ts">
import { onMounted, ref, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase';

const useBreakpoints = () => {
  let windowWidth = ref(window.innerWidth);

  const onWidthChange = () => (windowWidth.value = window.innerWidth);
  onMounted(() => window.addEventListener('resize', onWidthChange));
  onUnmounted(() => window.removeEventListener('resize', onWidthChange));

  const type = computed(() => {
    if (windowWidth.value < 550) return 'xs';
    if (windowWidth.value >= 550 && windowWidth.value < 1200) return 'md';
    if (windowWidth.value >= 1200) return 'lg';
    return null; // This is an unreachable line, simply to keep eslint happy.
  });

  const width = computed(() => windowWidth.value);

  return { width, type };
};

const session = ref();
const appointments = ref<any>([]);
const router = useRouter();
const loading = ref(true);
const attributes = ref<any>([
  {
    key: 'today',
    customData: {
      class: 'bg-blue-600 text-white',
      label: 'Date du jour',
    },
    dates: new Date(),
  },
]);
const { width, type } = useBreakpoints();

onMounted(() => {
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session;
    if (data.session) {
      getAppointments();
    }
  });

  supabase.auth.onAuthStateChange((_, _session) => {
    session.value = _session;
  });
});

async function getAppointments() {
  try {
    loading.value = true;

    let { data, error } = await supabase
      .from('appointments')
      .select('*, profiles!appointments_client_id_fkey(*)')
      .eq('doctor_id', session.value.user.id);
    console.log(session.value.user.id);
    if (error) throw error;
    if (data) {
      appointments.value = data;
      for (const apt of data) {
        const isBefore = new Date() > new Date(apt.date);
        attributes.value.push({
          key: apt.id,
          popover: {
            label: `RDV avec ${apt.profiles.first_name} ${apt.profiles.last_name}`,
          },
          dot: isBefore ? 'gray' : 'red',
          customData: {
            label: `RDV avec ${apt.profiles.first_name} ${apt.profiles.last_name}`,
            class: `${isBefore ? 'bg-gray-600' : 'bg-red-600'} text-white`,
          },
          dates: new Date(apt.date),
        });
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

async function signOut() {
  try {
    loading.value = true;
    let { error } = await supabase.auth.signOut();
    router.push({ name: 'login' });
    if (error) throw error;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <form class="form-widget">
    <p v-if="!session" class="text-red-500">
      Connectez vous pour voir vos rendez-vous
    </p>
    <h2 class="text-black">Vos rendez vous à venir</h2>
    <v-calendar :attributes="attributes">
      <template v-if="type === 'lg'" v-slot:day-content="{ day, attributes }">
        <div class="flex flex-col h-full z-10 overflow-hidden">
          <span class="day-label text-sm text-gray-900">{{ day.day }}</span>
          <div class="flex-grow overflow-y-auto overflow-x-auto">
            <p
              v-for="attr in attributes"
              :key="attr.key"
              class="text-xs leading-tight rounded-sm p-1 mt-0 mb-1"
              :class="attr.customData.class"
            >
              {{ attr.customData.label }}
            </p>
          </div>
        </div>
      </template>
    </v-calendar>
    <div>
      <button class="button block" @click.prevent="signOut" :disabled="loading">
        Se déconnecter
      </button>
    </div>
  </form>
</template>
