import { MaterialIcons } from '@expo/vector-icons';

export type AdminStepId =
  | 'CREATE_PROPERTY'
  | 'ADD_UNITS'
  | 'ADD_TENANT'
  | 'CREATE_LEASE'
  | 'CONFIGURE_BILLING'
  | 'RECORD_PAYMENT';

export type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface SubStepInstruction {
  id: string;
  title: string;
  detail: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  badge?: string;
}

export interface QuickOption {
  key: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  hint: string;
  badge?: string;
}

export interface AdminTutorialStep {
  id: AdminStepId;
  stepNumber: number;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
  actionLabel: string;
  estimatedMinutes: number;
  isCompleted: boolean;
  status: StepStatus;
  targetHint?: string;
  subSteps?: SubStepInstruction[];
  quickOptions?: QuickOption[];
}

export interface AdminTutorialProgress {
  completedStepIds: AdminStepId[];
  activeStepId: AdminStepId | null;
  isDismissed: boolean;
  isCompleted: boolean;
  lastUpdated: string;
}
