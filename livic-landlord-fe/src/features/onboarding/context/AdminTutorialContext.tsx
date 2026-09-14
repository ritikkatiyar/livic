import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import {
  AdminStepId,
  AdminTutorialStep,
  AdminTutorialProgress,
  StepStatus,
} from '../types/adminTutorial.types';

const STORAGE_KEY = 'livic.admin.tutorial.progress.v1';

export const ADMIN_TUTORIAL_STEPS: Omit<AdminTutorialStep, 'isCompleted' | 'status'>[] = [
  {
    id: 'CREATE_PROPERTY',
    stepNumber: 1,
    title: 'Create First Property',
    subtitle: 'Register property name, address & floor layout',
    description: 'Add your first real estate building or property structure to begin managing units and tenancies.',
    icon: 'domain',
    route: '/properties/create',
    actionLabel: 'Create Property',
    estimatedMinutes: 2,
    targetHint: "Fill out the Property Name, Address, City, Total Floors, and click 'BUILD PROPERTY'.",
    subSteps: [
      { id: 'p1', title: 'Basic Info', detail: 'Enter property name (e.g. Lumina Grand) and physical address.', icon: 'business' },
      { id: 'p2', title: 'Floor Count', detail: 'Specify total floors (e.g. 4 floors) to generate vertical stack.', icon: 'layers' },
      { id: 'p3', title: 'Unit Strategy', detail: 'Choose Mode A (Uniform Units/floor) OR Mode B (Draw in 2D Floor Editor).', icon: 'alt-route' },
    ],
    quickOptions: [
      { key: 'auto_fill', label: '⚡ Step 1: Auto-Fill Property Details', icon: 'auto-fix-high', hint: 'Pre-fills property name, address & 4 floors in 1 click' },
      { key: 'mode_global', label: '🏢 Step 2A: Mode A (Uniform 4 Units/floor)', icon: 'unfold-more', hint: 'Automatically creates 4 identical 2BHK rooms per floor' },
      { key: 'mode_custom', label: '✏️ Step 2B: Mode B (2D Canvas Editor)', icon: 'gesture', hint: 'Draw custom room shapes in 2D grid' },
    ],
  },
  {
    id: 'ADD_UNITS',
    stepNumber: 2,
    title: 'Configure Units & Layout',
    subtitle: 'Define room numbers and layout classes per floor',
    description: 'Set up room grids per floor in the interactive Floor Editor or automatic layout generator.',
    icon: 'grid-view',
    route: '/properties/floor-editor',
    actionLabel: 'Configure Units',
    estimatedMinutes: 1,
    targetHint: 'Use the Floor Editor visual grid to generate or customize unit numbers for your floors.',
    subSteps: [
      { id: 'u1', title: 'Select Canvas Tool', detail: 'Pick Room Block or Wall tool from lower canvas toolbar.', icon: 'border-color' },
      { id: 'u2', title: 'Draw Room Shapes', detail: 'Drag on 2D isometric grid canvas to draw room boundaries.', icon: 'crop-free' },
      { id: 'u3', title: 'Set Rent & Capacity', detail: 'Tap any room block to configure unit #, rent & bed capacity.', icon: 'monetization-on' },
    ],
    quickOptions: [
      { key: 'preset_grid', label: '📐 Auto-Generate 2x2 Grid', icon: 'grid-on', hint: 'Generates default 4 rooms per floor' },
      { key: 'set_rent', label: '🏷️ Set Standard Rent', icon: 'edit', hint: 'Applies ₹15,000 monthly rent across rooms' },
    ],
  },
  {
    id: 'ADD_TENANT',
    stepNumber: 3,
    title: 'Add First Tenant & Book Room',
    subtitle: 'Reserve a room or log prospective tenant details',
    description: 'Create a room reservation/booking with prospective tenant contact details.',
    icon: 'person-add',
    route: '/leases',
    actionLabel: 'Book Room',
    estimatedMinutes: 1,
    targetHint: "Click the 'Book Room' button in the header action bar and enter tenant details.",
    subSteps: [
      { id: 't1', title: 'Tenant Contact', detail: 'Enter full name, phone number, and email address.', icon: 'person' },
      { id: 't2', title: 'Room Selection', detail: 'Select assigned property, floor, and vacant unit.', icon: 'meeting-room' },
      { id: 't3', title: 'Token Deposit', detail: 'Record initial token payment (cash or online Razorpay).', icon: 'payments' },
    ],
    quickOptions: [
      { key: 'demo_booking', label: '👤 Quick Demo Booking', icon: 'person-add', hint: 'Fills sample tenant record (Rohan Sharma)' },
    ],
  },
  {
    id: 'CREATE_LEASE',
    stepNumber: 4,
    title: 'Create Lease Agreement',
    subtitle: 'Set rent terms, move-in date & security deposit',
    description: 'Convert room booking or issue an active lease agreement with monthly rent terms.',
    icon: 'assignment',
    route: '/leases',
    actionLabel: 'Convert to Lease',
    estimatedMinutes: 1,
    targetHint: "Locate the pending booking and click 'Convert to Lease' to finalize monthly rent terms.",
    subSteps: [
      { id: 'l1', title: 'Convert Booking', detail: 'Locate pending booking card on Leases screen.', icon: 'swap-horiz' },
      { id: 'l2', title: 'Lease Duration & Rent', detail: 'Set start date, duration (11 months), and deposit amount.', icon: 'event' },
      { id: 'l3', title: 'Activate Agreement', detail: 'Generate digital lease PDF & invite tenant to portal.', icon: 'task-alt' },
    ],
  },
  {
    id: 'CONFIGURE_BILLING',
    stepNumber: 5,
    title: 'Configure Billing & Utility Rules',
    subtitle: 'Establish recurring bill schedules & expense rules',
    description: 'Set up recurring expense splits (electricity, water, maintenance) for your property.',
    icon: 'receipt-long',
    route: '/billing',
    actionLabel: 'Configure Billing',
    estimatedMinutes: 2,
    targetHint: 'Review active utility expense categories and configure recurring bill structures.',
    subSteps: [
      { id: 'b1', title: 'SaaS Plan Selection', detail: 'Select subscription tier or top-up AI credits wallet.', icon: 'credit-card' },
      { id: 'b2', title: 'Utility Split Rules', detail: 'Set monthly calculation for electricity, water & maintenance.', icon: 'calculate' },
    ],
  },
  {
    id: 'RECORD_PAYMENT',
    stepNumber: 6,
    title: 'Record First Payment',
    subtitle: 'Log security deposit or monthly rent collection',
    description: 'Log cash or online token payments into the ledger to verify financial tracking.',
    icon: 'account-balance-wallet',
    route: '/billing',
    actionLabel: 'Record Payment',
    estimatedMinutes: 1,
    targetHint: "Click 'Record Payment' or log a token transaction to add your first payment entry.",
    subSteps: [
      { id: 'r1', title: 'Invoice Selection', detail: 'Pick rent collection or deposit line item.', icon: 'receipt' },
      { id: 'r2', title: 'Payment Mode', detail: 'Record online Razorpay transaction or cash entry.', icon: 'point-of-sale' },
    ],
  },
];

interface AdminTutorialContextValue {
  steps: AdminTutorialStep[];
  completedStepIds: AdminStepId[];
  activeStep: AdminTutorialStep | null;
  completedCount: number;
  totalSteps: number;
  progressPercent: number;
  isTutorialCompleted: boolean;
  isDismissed: boolean;
  isModalVisible: boolean;
  activeContextualHint: string | null;
  completeStep: (stepId: AdminStepId) => Promise<void>;
  uncompleteStep: (stepId: AdminStepId) => Promise<void>;
  resetTutorial: () => Promise<void>;
  dismissTutorial: () => Promise<void>;
  reopenTutorial: () => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
  navigateToStep: (stepId: AdminStepId) => void;
  autoDetectProgress: (data: {
    propertyCount?: number;
    unitCount?: number;
    bookingCount?: number;
    leaseCount?: number;
    paymentCount?: number;
  }) => void;
}

const AdminTutorialContext = createContext<AdminTutorialContextValue | null>(null);

function canUseWebStorage(): boolean {
  return Platform.OS === 'web' && typeof window !== 'undefined';
}

async function readProgressFromStorage(): Promise<AdminTutorialProgress | null> {
  try {
    const raw = canUseWebStorage()
      ? window.localStorage.getItem(STORAGE_KEY)
      : await SecureStore.getItemAsync(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminTutorialProgress) : null;
  } catch (err) {
    console.error('Failed reading tutorial progress', err);
    return null;
  }
}

async function writeProgressToStorage(progress: AdminTutorialProgress): Promise<void> {
  try {
    const value = JSON.stringify(progress);
    if (canUseWebStorage()) {
      window.localStorage.setItem(STORAGE_KEY, value);
    } else {
      await SecureStore.setItemAsync(STORAGE_KEY, value);
    }
  } catch (err) {
    console.error('Failed writing tutorial progress', err);
  }
}

export function AdminTutorialProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [completedStepIds, setCompletedStepIds] = useState<AdminStepId[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeContextualHint, setActiveContextualHint] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Read stored progress on mount
  useEffect(() => {
    let isMounted = true;
    readProgressFromStorage().then((saved) => {
      if (isMounted && saved) {
        setCompletedStepIds(saved.completedStepIds || []);
        setIsDismissed(Boolean(saved.isDismissed));
      }
      if (isMounted) {
        setIsLoaded(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const saveState = useCallback(
    async (nextCompleted: AdminStepId[], nextDismissed: boolean) => {
      const isCompleted = nextCompleted.length >= ADMIN_TUTORIAL_STEPS.length;
      const payload: AdminTutorialProgress = {
        completedStepIds: nextCompleted,
        activeStepId: ADMIN_TUTORIAL_STEPS.find((s) => !nextCompleted.includes(s.id))?.id || null,
        isDismissed: nextDismissed,
        isCompleted,
        lastUpdated: new Date().toISOString(),
      };
      await writeProgressToStorage(payload);
    },
    []
  );

  const completeStep = useCallback(
    async (stepId: AdminStepId) => {
      setCompletedStepIds((prev) => {
        if (prev.includes(stepId)) return prev;
        const next = [...prev, stepId];
        saveState(next, isDismissed);
        return next;
      });
    },
    [isDismissed, saveState]
  );

  const uncompleteStep = useCallback(
    async (stepId: AdminStepId) => {
      setCompletedStepIds((prev) => {
        const next = prev.filter((id) => id !== stepId);
        saveState(next, isDismissed);
        return next;
      });
    },
    [isDismissed, saveState]
  );

  const resetTutorial = useCallback(async () => {
    setCompletedStepIds([]);
    setIsDismissed(false);
    await saveState([], false);
  }, [saveState]);

  const dismissTutorial = useCallback(async () => {
    setIsDismissed(true);
    setIsModalVisible(false);
    await saveState(completedStepIds, true);
  }, [completedStepIds, saveState]);

  const reopenTutorial = useCallback(async () => {
    setIsDismissed(false);
    setIsModalVisible(true);
    await saveState(completedStepIds, false);
  }, [completedStepIds, saveState]);

  // Automatic progress detection based on real backend model state
  const autoDetectProgress = useCallback(
    ({
      propertyCount = 0,
      unitCount = 0,
      bookingCount = 0,
      leaseCount = 0,
      paymentCount = 0,
    }: {
      propertyCount?: number;
      unitCount?: number;
      bookingCount?: number;
      leaseCount?: number;
      paymentCount?: number;
    }) => {
      if (!isLoaded) return;
      setCompletedStepIds((prev) => {
        const next = new Set(prev);

        if (propertyCount > 0) next.add('CREATE_PROPERTY');
        if (unitCount > 0) next.add('ADD_UNITS');
        if (bookingCount > 0 || leaseCount > 0) next.add('ADD_TENANT');
        if (leaseCount > 0) next.add('CREATE_LEASE');
        if (leaseCount > 0 || paymentCount > 0) next.add('CONFIGURE_BILLING');
        if (paymentCount > 0) next.add('RECORD_PAYMENT');

        const arrayNext = Array.from(next);
        if (arrayNext.length !== prev.length) {
          saveState(arrayNext, isDismissed);
          return arrayNext;
        }
        return prev;
      });
    },
    [isLoaded, isDismissed, saveState]
  );

  // Compute full step objects with current status
  const steps = useMemo<AdminTutorialStep[]>(() => {
    let foundActive = false;
    return ADMIN_TUTORIAL_STEPS.map((step) => {
      const isCompleted = completedStepIds.includes(step.id);
      let status: StepStatus = 'PENDING';
      if (isCompleted) {
        status = 'COMPLETED';
      } else if (!foundActive) {
        status = 'IN_PROGRESS';
        foundActive = true;
      }
      return {
        ...step,
        isCompleted,
        status,
      };
    });
  }, [completedStepIds]);

  const activeStep = useMemo(() => {
    return steps.find((s) => s.status === 'IN_PROGRESS') || steps.find((s) => !s.isCompleted) || null;
  }, [steps]);

  const completedCount = completedStepIds.length;
  const totalSteps = ADMIN_TUTORIAL_STEPS.length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);
  const isTutorialCompleted = completedCount >= totalSteps;

  const openModal = useCallback(() => setIsModalVisible(true), []);
  const closeModal = useCallback(() => setIsModalVisible(false), []);

  const navigateToStep = useCallback(
    (stepId: AdminStepId) => {
      const targetStep = steps.find((s) => s.id === stepId);
      if (targetStep) {
        setActiveContextualHint(targetStep.targetHint || null);
        setIsModalVisible(false);
        router.push(targetStep.route as any);
      }
    },
    [steps, router]
  );

  const value = useMemo<AdminTutorialContextValue>(
    () => ({
      steps,
      completedStepIds,
      activeStep,
      completedCount,
      totalSteps,
      progressPercent,
      isTutorialCompleted,
      isDismissed,
      isModalVisible,
      activeContextualHint,
      completeStep,
      uncompleteStep,
      resetTutorial,
      dismissTutorial,
      reopenTutorial,
      openModal,
      closeModal,
      navigateToStep,
      autoDetectProgress,
    }),
    [
      steps,
      completedStepIds,
      activeStep,
      completedCount,
      totalSteps,
      progressPercent,
      isTutorialCompleted,
      isDismissed,
      isModalVisible,
      activeContextualHint,
      completeStep,
      uncompleteStep,
      resetTutorial,
      dismissTutorial,
      reopenTutorial,
      openModal,
      closeModal,
      navigateToStep,
      autoDetectProgress,
    ]
  );

  return (
    <AdminTutorialContext.Provider value={value}>
      {children}
    </AdminTutorialContext.Provider>
  );
}

export function useAdminTutorial(): AdminTutorialContextValue {
  const context = useContext(AdminTutorialContext);
  if (!context) {
    throw new Error('useAdminTutorial must be used inside AdminTutorialProvider.');
  }
  return context;
}
