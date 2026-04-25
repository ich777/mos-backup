<template>
  <div>
    <h2 class="mb-4">{{ $t('plugin_backup.title') }}</h2>
    <v-skeleton-loader v-if="loading" :loading="true" type="card" />
    <div v-else style="margin-bottom: 80px">

      <!-- Backup All -->
      <v-card class="mb-4 pa-0">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-backup-restore</v-icon>
          <span>{{ $t('plugin_backup.backup_all') }}</span>
        </v-card-title>
        <v-card-text>
          <span class="text-medium-emphasis text-body-2">{{ $t('plugin_backup.backup_all_hint') }}</span>
          <v-divider class="my-4"></v-divider>
          <span class="text-subtitle-1 font-weight-medium">{{ $t('plugin_backup.backup_schedule') }}</span>
          <v-row class="align-center pt-2">
            <v-col cols="12" md="2">
              <v-switch
                v-model="settings.backup_all.schedule.enabled"
                :label="$t('plugin_backup.schedule')"
                inset
                color="green"
                hide-details
              ></v-switch>
            </v-col>
            <v-col cols="12" md="10">
              <v-text-field
                v-model="settings.backup_all.schedule.cron"
                :label="$t('plugin_backup.cron_schedule')"
                :disabled="!settings.backup_all.schedule.enabled"
                density="comfortable"
                hide-details="auto"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-divider class="my-4"></v-divider>
          <v-btn color="secondary" rounded :loading="bootRunning || appdataRunning || libvirtRunning" @click="runAllBackups">
            <v-icon start>mdi-backup-restore</v-icon>
            {{ $t('plugin_backup.backup_now') }}
          </v-btn>
        </v-card-text>
      </v-card>

      <!-- Boot Backup Settings -->
      <v-card class="mb-4 pa-0">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-harddisk</v-icon>
          <span>{{ $t('plugin_backup.boot_backup') }}</span>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="settings.boot.destination"
            :label="$t('plugin_backup.destination')"
            append-inner-icon="mdi-folder"
            @click:append-inner="openFsDialog('boot', 'destination')"
            :hint="$t('plugin_backup.boot_destination_hint')"
            persistent-hint
          ></v-text-field>
          <v-row class="mt-2">
            <v-col cols="12" md="6">
              <v-switch
                v-model="settings.boot.compression"
                :label="$t('plugin_backup.compression')"
                inset
                color="green"
                density="compact"
                :hint="$t('plugin_backup.compression_hint')"
                persistent-hint
              ></v-switch>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="settings.boot.backups_to_keep"
                :label="$t('plugin_backup.backups_to_keep')"
                type="number"
                min="1"
                max="100"
                hide-details="auto"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-divider class="my-4"></v-divider>
          <span class="text-subtitle-1 font-weight-medium">{{ $t('plugin_backup.backup_schedule') }}</span>
          <v-row class="align-center pt-2">
            <v-col cols="12" md="2">
              <v-switch
                v-model="settings.boot.schedule.enabled"
                :label="$t('plugin_backup.schedule')"
                inset
                color="green"
                hide-details
              ></v-switch>
            </v-col>
            <v-col cols="12" md="10">
              <v-text-field
                v-model="settings.boot.schedule.cron"
                :label="$t('plugin_backup.cron_schedule')"
                :disabled="!settings.boot.schedule.enabled"
                density="comfortable"
                hide-details="auto"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-divider class="my-4"></v-divider>
          <div class="d-flex align-center">
            <v-btn color="primary" rounded :loading="bootRunning" :disabled="!settings.boot.destination" @click="runBackup('run_boot_backup', 'Boot Backup', 'boot')">
              <v-icon start>mdi-backup-restore</v-icon>
              {{ $t('plugin_backup.backup_now') }}
            </v-btn>
            <span v-if="bootRunning" class="ml-4 text-medium-emphasis">{{ $t('plugin_backup.backup_running') }}</span>
          </div>
        </v-card-text>
      </v-card>

      <!-- Appdata Backup Settings -->
      <v-card class="mb-4 pa-0">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-folder-multiple</v-icon>
          <span>{{ $t('plugin_backup.appdata_backup') }}</span>
        </v-card-title>
        <v-card-text>
          <v-text-field
            :model-value="appdataSource"
            :label="$t('plugin_backup.source')"
            :hint="$t('plugin_backup.appdata_source_hint')"
            persistent-hint
            readonly
            disabled
          ></v-text-field>
          <v-text-field
            v-model="settings.appdata.destination"
            :label="$t('plugin_backup.destination')"
            append-inner-icon="mdi-folder"
            @click:append-inner="openFsDialog('appdata', 'destination')"
            class="mt-2"
          ></v-text-field>
          <v-row class="mt-2">
            <v-col cols="12" md="4">
              <v-switch
                v-model="settings.appdata.compression"
                :label="$t('plugin_backup.compression')"
                inset
                color="green"
                density="compact"
                :hint="$t('plugin_backup.compression_hint')"
                persistent-hint
              ></v-switch>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="settings.appdata.backups_to_keep"
                :label="$t('plugin_backup.backups_to_keep')"
                type="number"
                min="1"
                max="100"
                hide-details="auto"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-divider class="my-4"></v-divider>
          <span class="text-subtitle-1 font-weight-medium">{{ $t('plugin_backup.exclude_dirs') }}</span>
          <div class="mt-2">
            <v-btn size="small" variant="tonal" color="primary" @click="fetchAppdataDirs(); fetchContainerNames()" :loading="appdataDirsLoading" class="mb-2">
              <v-icon start>mdi-refresh</v-icon>
              {{ $t('plugin_backup.refresh_dirs') }}
            </v-btn>
            <v-chip-group v-if="availableAppdataDirs.length > 0" v-model="settings.appdata.exclude_dirs" column multiple>
              <v-chip
                v-for="dir in availableAppdataDirs"
                :key="dir"
                :value="dir"
                filter
                variant="outlined"
              >
                {{ dir }}
              </v-chip>
            </v-chip-group>
            <div v-else class="text-grey text-body-2 mt-1">
              {{ $t('plugin_backup.no_dirs_hint') }}
            </div>
          </div>
          <v-divider class="my-4"></v-divider>
          <span class="text-subtitle-1 font-weight-medium">{{ $t('plugin_backup.stop_containers') }}</span>
          <div class="mt-1">
            <span class="text-medium-emphasis text-body-2">{{ $t('plugin_backup.stop_containers_hint') }}</span>
          </div>
          <div class="mt-2">
            <v-chip-group v-if="containerNames.length > 0" v-model="settings.appdata.stop_containers" column multiple>
              <v-chip
                v-for="name in containerNames"
                :key="'stop-' + name"
                :value="name"
                filter
                variant="outlined"
                color="orange"
              >
                {{ name }}
              </v-chip>
            </v-chip-group>
            <div v-else class="text-grey text-body-2 mt-1">
              {{ $t('plugin_backup.no_containers_hint') }}
            </div>
          </div>
          <v-divider class="my-4"></v-divider>
          <span class="text-subtitle-1 font-weight-medium">{{ $t('plugin_backup.backup_schedule') }}</span>
          <v-row class="align-center pt-2">
            <v-col cols="12" md="2">
              <v-switch
                v-model="settings.appdata.schedule.enabled"
                :label="$t('plugin_backup.schedule')"
                inset
                color="green"
                hide-details
              ></v-switch>
            </v-col>
            <v-col cols="12" md="10">
              <v-text-field
                v-model="settings.appdata.schedule.cron"
                :label="$t('plugin_backup.cron_schedule')"
                :disabled="!settings.appdata.schedule.enabled"
                density="comfortable"
                hide-details="auto"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-divider class="my-4"></v-divider>
          <div class="d-flex align-center">
            <v-btn color="primary" rounded :loading="appdataRunning" :disabled="!appdataSource || !settings.appdata.destination" @click="runBackup('run_appdata_backup', 'Appdata Backup', 'appdata')">
              <v-icon start>mdi-backup-restore</v-icon>
              {{ $t('plugin_backup.backup_now') }}
            </v-btn>
            <span v-if="appdataRunning" class="ml-4 text-medium-emphasis">{{ $t('plugin_backup.backup_running') }}</span>
          </div>
        </v-card-text>
      </v-card>

      <!-- Libvirt Backup Settings -->
      <v-card class="mb-4 pa-0">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-desktop-classic</v-icon>
          <span>{{ $t('plugin_backup.libvirt_backup') }}</span>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="settings.libvirt.source"
            :label="$t('plugin_backup.source')"
            append-inner-icon="mdi-folder"
            @click:append-inner="openFsDialog('libvirt', 'source')"
            :hint="$t('plugin_backup.libvirt_source_hint')"
            persistent-hint
          ></v-text-field>
          <v-text-field
            v-model="settings.libvirt.destination"
            :label="$t('plugin_backup.destination')"
            append-inner-icon="mdi-folder"
            @click:append-inner="openFsDialog('libvirt', 'destination')"
            class="mt-2"
          ></v-text-field>
          <v-row class="mt-2">
            <v-col cols="12" md="6">
              <v-switch
                v-model="settings.libvirt.compression"
                :label="$t('plugin_backup.compression')"
                inset
                color="green"
                density="compact"
                :hint="$t('plugin_backup.compression_hint')"
                persistent-hint
              ></v-switch>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="settings.libvirt.backups_to_keep"
                :label="$t('plugin_backup.backups_to_keep')"
                type="number"
                min="1"
                max="100"
                hide-details="auto"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-divider class="my-4"></v-divider>
          <span class="text-subtitle-1 font-weight-medium">{{ $t('plugin_backup.backup_schedule') }}</span>
          <v-row class="align-center pt-2">
            <v-col cols="12" md="2">
              <v-switch
                v-model="settings.libvirt.schedule.enabled"
                :label="$t('plugin_backup.schedule')"
                inset
                color="green"
                hide-details
              ></v-switch>
            </v-col>
            <v-col cols="12" md="10">
              <v-text-field
                v-model="settings.libvirt.schedule.cron"
                :label="$t('plugin_backup.cron_schedule')"
                :disabled="!settings.libvirt.schedule.enabled"
                density="comfortable"
                hide-details="auto"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-divider class="my-4"></v-divider>
          <div class="d-flex align-center">
            <v-btn color="primary" rounded :loading="libvirtRunning" :disabled="!settings.libvirt.destination" @click="runBackup('run_libvirt_backup', 'Libvirt Backup', 'libvirt')">
              <v-icon start>mdi-backup-restore</v-icon>
              {{ $t('plugin_backup.backup_now') }}
            </v-btn>
            <span v-if="libvirtRunning" class="ml-4 text-medium-emphasis">{{ $t('plugin_backup.backup_running') }}</span>
          </div>
        </v-card-text>
      </v-card>

    </div>

    <!-- File System Navigator Dialog -->
    <v-dialog v-model="fsDialog" max-width="800">
      <v-card>
        <v-card-title class="d-flex align-center">
          <span>{{ $t('plugin_backup.select_directory') }}</span>
          <v-spacer />
          <v-chip size="small" class="ml-2" variant="tonal">{{ fsCurrentPath || '/' }}</v-chip>
        </v-card-title>
        <v-card-subtitle class="pb-0">
          <div class="d-flex align-center ga-2">
            <v-btn size="small" variant="text" icon="mdi-home" @click="fsGoRoot" color="secondary" :disabled="fsLoading" />
            <v-btn size="small" variant="text" icon="mdi-arrow-up" @click="fsNavigateUp" color="secondary" :disabled="fsCurrentPath === '/mnt' || fsLoading" />
            <v-btn size="small" variant="text" icon="mdi-refresh" @click="fetchDirectory(fsCurrentPath)" color="secondary" :disabled="fsLoading" />
            <v-spacer />
            <v-progress-circular v-if="fsLoading" indeterminate size="20" color="secondary" />
          </div>
        </v-card-subtitle>
        <v-card-text class="pt-2" style="min-height: 300px; max-height: 60vh; overflow-y: auto">
          <v-table density="compact">
            <thead>
              <tr>
                <th>{{ $t('plugin_backup.name') }}</th>
                <th style="width: 40%">{{ $t('plugin_backup.path') }}</th>
                <th style="width: 60px" class="text-center">{{ $t('plugin_backup.action') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!fsLoading && fsItems.length === 0">
                <td colspan="3" class="text-center text-medium-emphasis">
                  {{ $t('plugin_backup.no_entries') }}
                </td>
              </tr>
              <tr
                v-for="item in fsItems"
                :key="item.path"
                :class="['cursor-pointer', fsActiveItem && fsActiveItem.path === item.path ? 'bg-primary bg-opacity-10' : '']"
                @click="fsActiveItem = item"
                @dblclick.stop.prevent="fsNavigateInto(item)"
              >
                <td>
                  <div class="d-flex align-center ga-2">
                    <v-icon size="18">mdi-folder</v-icon>
                    <span>{{ item.name }}</span>
                  </div>
                </td>
                <td><span class="text-caption">{{ item.displayPath || item.path }}</span></td>
                <td class="text-center">
                  <v-btn size="small" icon="mdi-folder-open" variant="text" @click.stop="fsNavigateInto(item)" :disabled="fsLoading" />
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-divider />
        <v-card-actions class="d-flex align-center">
          <div class="text-caption text-truncate" style="max-width: 60%">
            <strong>{{ $t('plugin_backup.selected') }}:</strong>
            <span v-if="fsActiveItem">
              {{ fsActiveItem.displayPath || fsActiveItem.path }}
            </span>
            <span v-else>-</span>
          </div>
          <v-spacer />
          <v-btn variant="text" color="onPrimary" @click="fsDialog = false">{{ $t('plugin_backup.cancel') }}</v-btn>
          <v-btn color="onPrimary" @click="fsSelect" :disabled="fsLoading">{{ $t('plugin_backup.select') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Save FAB -->
    <v-fab @click="saveSettings" color="primary" style="position: fixed; bottom: 32px; right: 32px; z-index: 1000" size="large" icon :loading="saving">
      <v-icon>mdi-content-save</v-icon>
    </v-fab>

    <v-overlay :model-value="overlay" class="align-center justify-center">
      <v-progress-circular color="onPrimary" size="64" indeterminate></v-progress-circular>
    </v-overlay>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue';

const PLUGIN_NAME = 'backup';

const loading = ref(true);
const saving = ref(false);
const overlay = ref(false);
const bootRunning = ref(false);
const appdataRunning = ref(false);
const libvirtRunning = ref(false);

const availableAppdataDirs = ref([]);
const containerNames = ref([]);
const appdataDirsLoading = ref(false);
const appdataSource = ref('');

let statusInterval = null;

const settings = reactive({
  backup_all: {
    schedule: {
      enabled: false,
      cron: '0 3 * * *',
    },
  },
  boot: {
    destination: '',
    compression: true,
    backups_to_keep: 3,
    schedule: {
      enabled: false,
      cron: '0 3 * * *',
    },
  },
  appdata: {
    destination: '',
    compression: false,
    exclude_dirs: [],
    stop_containers: [],
    backups_to_keep: 5,
    schedule: {
      enabled: false,
      cron: '0 4 * * *',
    },
  },
  libvirt: {
    source: '/etc/libvirt',
    destination: '',
    compression: false,
    backups_to_keep: 5,
    schedule: {
      enabled: false,
      cron: '0 5 * * *',
    },
  },
});

// File system navigator state
const fsDialog = ref(false);
const fsCurrentPath = ref('/mnt');
const fsItems = ref([]);
const fsLoading = ref(false);
const fsActiveItem = ref(null);
const fsTargetSection = ref('');
const fsTargetField = ref('');

const getAuthHeaders = () => ({
  Authorization: 'Bearer ' + localStorage.getItem('authToken'),
});

// Mutual exclusion: backup_all ON → individual schedules OFF
watch(() => settings.backup_all.schedule.enabled, (val) => {
  if (val) {
    settings.boot.schedule.enabled = false;
    settings.appdata.schedule.enabled = false;
    settings.libvirt.schedule.enabled = false;
  }
});

// Individual schedule ON → backup_all OFF
watch(
  [() => settings.boot.schedule.enabled, () => settings.appdata.schedule.enabled, () => settings.libvirt.schedule.enabled],
  ([boot, appdata, libvirt]) => {
    if (boot || appdata || libvirt) {
      settings.backup_all.schedule.enabled = false;
    }
  }
);

// Fetch plugin settings
const fetchSettings = async () => {
  try {
    const res = await fetch(`/api/v1/mos/plugins/settings/${PLUGIN_NAME}`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.backup_all) {
        if (data.backup_all.schedule) {
          settings.backup_all.schedule.enabled = data.backup_all.schedule.enabled || false;
          settings.backup_all.schedule.cron = data.backup_all.schedule.cron || '0 3 * * *';
        }
      }
      if (data.boot) {
        settings.boot.destination = data.boot.destination || '';
        settings.boot.compression = data.boot.compression !== undefined ? data.boot.compression : true;
        settings.boot.backups_to_keep = data.boot.backups_to_keep || 3;
        if (data.boot.schedule) {
          settings.boot.schedule.enabled = data.boot.schedule.enabled || false;
          settings.boot.schedule.cron = data.boot.schedule.cron || '0 3 * * *';
        }
      }
      if (data.appdata) {
        settings.appdata.destination = data.appdata.destination || '';
        settings.appdata.compression = data.appdata.compression !== undefined ? data.appdata.compression : false;
        settings.appdata.exclude_dirs = Array.isArray(data.appdata.exclude_dirs) ? data.appdata.exclude_dirs : [];
        settings.appdata.stop_containers = Array.isArray(data.appdata.stop_containers) ? data.appdata.stop_containers : [];
        settings.appdata.backups_to_keep = data.appdata.backups_to_keep || 5;
        if (data.appdata.schedule) {
          settings.appdata.schedule.enabled = data.appdata.schedule.enabled || false;
          settings.appdata.schedule.cron = data.appdata.schedule.cron || '0 4 * * *';
        }
      }
      if (data.libvirt) {
        settings.libvirt.source = data.libvirt.source || '/etc/libvirt';
        settings.libvirt.destination = data.libvirt.destination || '';
        settings.libvirt.compression = data.libvirt.compression !== undefined ? data.libvirt.compression : false;
        settings.libvirt.backups_to_keep = data.libvirt.backups_to_keep || 5;
        if (data.libvirt.schedule) {
          settings.libvirt.schedule.enabled = data.libvirt.schedule.enabled || false;
          settings.libvirt.schedule.cron = data.libvirt.schedule.cron || '0 5 * * *';
        }
      }
    }
  } catch (e) {
    console.error('Failed to fetch settings:', e);
  }
};

// Save plugin settings
const saveSettings = async () => {
  saving.value = true;
  try {
    const res = await fetch(`/api/v1/mos/plugins/settings/${PLUGIN_NAME}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        backup_all: {
          schedule: {
            enabled: settings.backup_all.schedule.enabled,
            cron: settings.backup_all.schedule.cron,
          },
        },
        boot: {
          destination: settings.boot.destination,
          compression: settings.boot.compression,
          backups_to_keep: settings.boot.backups_to_keep,
          schedule: {
            enabled: settings.boot.schedule.enabled,
            cron: settings.boot.schedule.cron,
          },
        },
        appdata: {
          destination: settings.appdata.destination,
          compression: settings.appdata.compression,
          exclude_dirs: availableAppdataDirs.value.length > 0
            ? settings.appdata.exclude_dirs.filter(d => availableAppdataDirs.value.includes(d))
            : settings.appdata.exclude_dirs,
          stop_containers: containerNames.value.length > 0
            ? settings.appdata.stop_containers.filter(c => containerNames.value.includes(c))
            : settings.appdata.stop_containers,
          backups_to_keep: settings.appdata.backups_to_keep,
          schedule: {
            enabled: settings.appdata.schedule.enabled,
            cron: settings.appdata.schedule.cron,
          },
        },
        libvirt: {
          source: settings.libvirt.source,
          destination: settings.libvirt.destination,
          compression: settings.libvirt.compression,
          backups_to_keep: settings.libvirt.backups_to_keep,
          schedule: {
            enabled: settings.libvirt.schedule.enabled,
            cron: settings.libvirt.schedule.cron,
          },
        },
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('Failed to save settings:', error);
      return;
    }

    // Update all schedules via executefunction
    await fetch('/api/v1/mos/plugins/executefunction', {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plugin: PLUGIN_NAME,
        function: 'update_schedule',
      }),
    });
  } catch (e) {
    console.error('Failed to save settings:', e);
  } finally {
    saving.value = false;
  }
};

// Check if a backup is currently running
const fetchBackupStatus = async () => {
  try {
    const res = await fetch('/api/v1/mos/plugins/query', {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command: 'mos_backup',
        args: ['--status'],
        timeout: 5,
        parse_json: true,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.output && typeof data.output === 'object') {
        bootRunning.value = data.output.boot === true;
        appdataRunning.value = data.output.appdata === true;
        libvirtRunning.value = data.output.libvirt === true;
      }
    }
  } catch (e) {
    // Ignore status check errors
  }
};

// Fetch available appdata directories (for exclude picker)
const fetchAppdataDirs = async () => {
  appdataDirsLoading.value = true;
  try {
    const res = await fetch('/api/v1/mos/plugins/query', {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command: 'mos_backup',
        args: ['--appdata-dirs'],
        timeout: 10,
        parse_json: true,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.output)) {
        availableAppdataDirs.value = data.output;
      }
    }
  } catch (e) {
    console.error('Failed to fetch appdata dirs:', e);
  } finally {
    appdataDirsLoading.value = false;
  }
};

// Fetch running containers with appdata mounts (for stop_containers picker)
const fetchContainerNames = async () => {
  try {
    const res = await fetch('/api/v1/mos/plugins/query', {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command: 'mos_backup',
        args: ['--containers'],
        timeout: 15,
        parse_json: true,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.output)) {
        containerNames.value = data.output;
      }
    }
  } catch (e) {
    console.error('Failed to fetch container names:', e);
  }
};

// Get the running ref for a given section
const getRunningRef = (section) => {
  if (section === 'boot') return bootRunning;
  if (section === 'appdata') return appdataRunning;
  if (section === 'libvirt') return libvirtRunning;
  return ref(false);
};

// Run a backup via executefunction
const runBackup = async (functionName, displayName, section) => {
  const runningRef = getRunningRef(section);
  runningRef.value = true;
  try {
    await fetch('/api/v1/mos/plugins/executefunction', {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plugin: PLUGIN_NAME,
        function: functionName,
      }),
    });

    // Poll for completion
    const pollStatus = setInterval(async () => {
      await fetchBackupStatus();
      if (!runningRef.value) {
        clearInterval(pollStatus);
      }
    }, 3000);

    // Timeout after 10 minutes
    setTimeout(() => {
      clearInterval(pollStatus);
      runningRef.value = false;
    }, 600000);
  } catch (e) {
    console.error('Failed to start backup:', e);
    runningRef.value = false;
  }
};

// Run all configured backups
const runAllBackups = async () => {
  bootRunning.value = true;
  appdataRunning.value = true;
  libvirtRunning.value = true;
  try {
    await fetch('/api/v1/mos/plugins/executefunction', {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plugin: PLUGIN_NAME,
        function: 'run_all_backups',
      }),
    });

    // Poll for completion
    const pollStatus = setInterval(async () => {
      await fetchBackupStatus();
      if (!bootRunning.value && !appdataRunning.value && !libvirtRunning.value) {
        clearInterval(pollStatus);
      }
    }, 3000);

    // Timeout after 30 minutes
    setTimeout(() => {
      clearInterval(pollStatus);
      bootRunning.value = false;
      appdataRunning.value = false;
      libvirtRunning.value = false;
    }, 1800000);
  } catch (e) {
    console.error('Failed to start backup all:', e);
    bootRunning.value = false;
    appdataRunning.value = false;
    libvirtRunning.value = false;
  }
};

// File system navigator — uses /api/v1/mos/fsnavigator (same as frontend)
const fetchDirectory = async (dirPath) => {
  fsLoading.value = true;
  fsActiveItem.value = null;
  try {
    const url = new URL('/api/v1/mos/fsnavigator', window.location.origin);
    if (dirPath && dirPath !== '/') {
      url.searchParams.set('path', dirPath);
    }
    url.searchParams.set('type', 'directories');
    url.searchParams.set('roots', '/mnt');

    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      fsCurrentPath.value = data.currentPath || dirPath || '/mnt';
      fsItems.value = Array.isArray(data.items) ? data.items : [];
    } else {
      fsItems.value = [];
    }
  } catch (e) {
    console.error('Failed to fetch directory:', e);
    fsItems.value = [];
  } finally {
    fsLoading.value = false;
  }
};

const openFsDialog = (section, field) => {
  fsTargetSection.value = section;
  fsTargetField.value = field;
  fsCurrentPath.value = settings[section][field] || '/mnt';
  fsDialog.value = true;
  fetchDirectory(fsCurrentPath.value);
};

const fsNavigateInto = (item) => {
  if (!item || item.type !== 'directory') return;
  fetchDirectory(item.path);
};

const fsGoRoot = () => {
  fetchDirectory('/mnt');
};

const fsNavigateUp = () => {
  const parts = fsCurrentPath.value.split('/').filter(Boolean);
  parts.pop();
  const parent = '/' + parts.join('/');
  fetchDirectory(parent.length >= 4 ? parent : '/mnt');
};

const fsSelect = () => {
  const selected = fsActiveItem.value ? fsActiveItem.value.path : fsCurrentPath.value;
  settings[fsTargetSection.value][fsTargetField.value] = selected;
  fsDialog.value = false;
};

// Fetch appdata path from docker settings
const fetchDockerAppdata = async () => {
  try {
    const res = await fetch('/api/v1/mos/settings/docker', {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      appdataSource.value = data.appdata || '';
    }
  } catch (e) {
    console.error('Failed to fetch docker settings:', e);
  }
};

onMounted(async () => {
  try {
    await fetchSettings();
    await fetchBackupStatus();

    // Load appdata source from docker settings
    await fetchDockerAppdata();

    // Auto-load appdata dirs if source is configured
    if (appdataSource.value) {
      await Promise.all([fetchAppdataDirs(), fetchContainerNames()]);
    }

    // Poll backup status every 10 seconds
    statusInterval = setInterval(fetchBackupStatus, 10000);
  } catch (e) {
    console.error('Failed to initialize:', e);
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval);
    statusInterval = null;
  }
});
</script>
