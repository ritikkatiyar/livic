import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useBilling } from '@/src/features/finance/hooks/useBilling';
import { SkeletonRow } from '@/src/components/common/feedback/Skeleton';
import { ContextualStepGuideBar } from '@/src/features/onboarding/components/ContextualStepGuideBar';

// Sub-components
import { WalletCard } from '../components/billing/WalletCard';
import { PlanCard } from '../components/billing/PlanCard';
import { CalculatorCard } from '../components/billing/CalculatorCard';
import { TopUpCard } from '../components/billing/TopUpCard';

import { PlanResponse } from '@/src/features/finance/api/billing.api';

const { width } = Dimensions.get('window');

const DEFAULT_PLANS: PlanResponse[] = [
  {
    id: 'starter-plan',
    planKey: 'STARTER',
    name: 'Starter Plan',
    priceMonthly: 999,
    priceYearly: 799,
    currency: 'INR',
    features: [
      { featureKey: 'UNITS', displayLabel: 'Up to 10 Units', limitValue: 10, included: true },
      { featureKey: 'AI_DESK', displayLabel: 'Basic AI Support Desk', limitValue: 100, included: true },
      { featureKey: 'COMMUNICATION', displayLabel: 'Tenant Announcements', limitValue: 0, included: true },
    ],
  },
  {
    id: 'pro-plan',
    planKey: 'PRO',
    name: 'Pro Landlord',
    priceMonthly: 2499,
    priceYearly: 1999,
    currency: 'INR',
    features: [
      { featureKey: 'UNITS', displayLabel: 'Up to 50 Units', limitValue: 50, included: true },
      { featureKey: 'AI_DESK', displayLabel: 'Priority AI Copilot & Escalations', limitValue: 1000, included: true },
      { featureKey: 'FINANCE', displayLabel: 'Automated Rent Cycles & Online Payments', limitValue: 0, included: true },
      { featureKey: 'COMMUNICATION', displayLabel: 'SMS & WhatsApp Notifications', limitValue: 0, included: true },
    ],
  },
  {
    id: 'enterprise-plan',
    planKey: 'ENTERPRISE',
    name: 'Enterprise Portfolio',
    priceMonthly: 5999,
    priceYearly: 4799,
    currency: 'INR',
    features: [
      { featureKey: 'UNITS', displayLabel: 'Unlimited Property Units', limitValue: 9999, included: true },
      { featureKey: 'AI_DESK', displayLabel: 'Custom AI Assistant & Full Automation', limitValue: 10000, included: true },
      { featureKey: 'FINANCE', displayLabel: 'Multi-Bank Reconciliation & Custom Reports', limitValue: 0, included: true },
      { featureKey: 'DEDICATED', displayLabel: '24/7 Dedicated Account Manager', limitValue: 0, included: true },
    ],
  },
];

type BillingScreenProps = {
  token: string;
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function BillingScreen({ token }: BillingScreenProps) {
  const { theme, isDark } = useAppTheme();
  const { isDesktop } = useResponsive();
  const styles = React.useMemo(() => createStyles(theme, isDark, isDesktop), [theme, isDark, isDesktop]);

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { handleScroll } = useScrollNav();

  // Custom React-Query Hook
  const {
    billingData,
    plans,
    isLoading,
    refetchStatus,
    subscribeToPlan,
    topUpWallet,
    verifyPayment,
  } = useBilling(token);

  const [isAnnual, setIsAnnual] = useState(false);
  const [expectedAITasks, setExpectedAITasks] = useState(1000);
  const [additionalUnits, setAdditionalUnits] = useState(5);
  const [topUpAmount, setTopUpAmount] = useState('500');
  const [subscribingPlanKey, setSubscribingPlanKey] = useState<string | null>(null);
  const [isTopUpProcessing, setIsTopUpProcessing] = useState(false);

  useEffect(() => {
    loadRazorpayScript();
  }, [token]);

  const loadRazorpayScript = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  };

  const handleSubscribe = async (planKey: string, price: number) => {
    try {
      setSubscribingPlanKey(planKey);
      const cycle = isAnnual ? 'YEARLY' : 'MONTHLY';
      const finalAmount = isAnnual ? price * 12 * 0.8 : price;

      const res = await subscribeToPlan({
        planName: planKey,
        amount: finalAmount,
        billingCycle: cycle,
      });

      const razorpayKey = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_TKP4I9m5sGhRXH';

      if (Platform.OS === 'web' && window.Razorpay) {
        const options: any = {
          key: razorpayKey,
          name: 'Livic TenantApp',
          description: `${planKey} Plan Subscription (${cycle})`,
          upi: { flow: 'qr' },
          method: { upi: true, card: true, netbanking: true, wallet: true },
          prefill: { method: 'upi' },
          handler: async function (response: any) {
            try {
              await verifyPayment({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id || options.order_id || res.gatewayTransactionId,
                razorpaySignature: response.razorpay_signature,
              });
              Alert.alert('Success!', `Subscribed to ${planKey} plan successfully!`, [
                { text: 'Great!', onPress: () => refetchStatus() },
              ]);
            } catch (err: any) {
              Alert.alert('Verification Error', err.message || 'Could not verify payment. Contact support.');
            } finally {
              setSubscribingPlanKey(null);
            }
          },
          modal: {
            ondismiss: function () {
              setSubscribingPlanKey(null);
            },
          },
        };

        if (res.gatewayTransactionId && !res.gatewayTransactionId.startsWith('order_rzp_test_') && !res.gatewayTransactionId.startsWith('sub_rzp_test_')) {
          options.order_id = res.gatewayTransactionId;
        } else {
          options.amount = Math.round(finalAmount * 100);
          options.currency = 'INR';
        }

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        Alert.alert(
          'Subscription Initiated!',
          `Plan ${planKey} (${cycle}) checkout initiated via Razorpay Test Mode.`,
          [{ text: 'OK', onPress: () => refetchStatus() }]
        );
        setSubscribingPlanKey(null);
      }
    } catch (error: any) {
      Alert.alert('Subscription Failed', error.message || 'Check your payment connection.');
      setSubscribingPlanKey(null);
    }
  };

  const handleTopUp = async () => {
    const amt = parseFloat(topUpAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a positive top-up amount.');
      return;
    }

    try {
      setIsTopUpProcessing(true);
      const res = await topUpWallet({ amount: amt });
      const creditsAdded = Math.round(amt);
      const razorpayKey = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_TKP4I9m5sGhRXH';

      if (Platform.OS === 'web' && window.Razorpay) {
        const options: any = {
          key: razorpayKey,
          name: 'Livic TenantApp',
          description: `AI Wallet Top-Up (+${creditsAdded} Credits)`,
          upi: { flow: 'qr' },
          method: { upi: true, card: true, netbanking: true, wallet: true },
          prefill: { method: 'upi' },
          handler: async function (response: any) {
            try {
              await verifyPayment({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id || res.gatewayTransactionId,
                razorpaySignature: response.razorpay_signature,
              });
              Alert.alert('Top-Up Successful!', `+${creditsAdded} AI credits added to your wallet.`, [
                { text: 'Done', onPress: () => refetchStatus() },
              ]);
            } catch (err: any) {
              Alert.alert('Verification Error', err.message || 'Could not verify payment. Contact support.');
            } finally {
              setIsTopUpProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsTopUpProcessing(false);
            },
          },
        };

        if (res.gatewayTransactionId && !res.gatewayTransactionId.startsWith('order_rzp_test_') && !res.gatewayTransactionId.startsWith('sub_rzp_test_')) {
          options.order_id = res.gatewayTransactionId;
        } else {
          options.amount = Math.round(amt * 100);
          options.currency = 'INR';
        }

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        Alert.alert(
          'Top-Up Successful!',
          `Purchased ₹${amt.toFixed(0)} converting to +${creditsAdded} AI credits instantly.`,
          [{ text: 'Done', onPress: () => refetchStatus() }]
        );
        setIsTopUpProcessing(false);
      }
    } catch (error: any) {
      Alert.alert('Top-Up Failed', error.message || 'Payment processing error.');
      setIsTopUpProcessing(false);
    }
  };

  const currentPlan = billingData?.subscription?.planName || 'STARTER';
  const remainingCredits = billingData?.wallet?.creditBalance || 0;
  const displayPlans = plans && plans.length > 0 ? plans : DEFAULT_PLANS;

  return (
    <PageShell
      scrollable={true}
      header={null}
      edges={isDesktop ? ['top'] : []}
      contentContainerStyle={[styles.scrollContent, !isDesktop && { paddingTop: 16 }]}
    >
          <View style={isDesktop ? styles.desktopInner : null}>
            {isDesktop && (
              <View style={styles.titleContainer}>
                <Text style={styles.titleLineDesktop}>SaaS Subscription & Billing</Text>
                <Text style={styles.subtitleDesktop}>Manage subscription plan tier, Razorpay gateway & prepaid AI credit wallet</Text>
              </View>
            )}

            <ContextualStepGuideBar stepId="CONFIGURE_BILLING" />
            <ContextualStepGuideBar stepId="RECORD_PAYMENT" />
          
            {/* 1. Wallet Status Card */}
            <WalletCard currentPlan={currentPlan} remainingCredits={remainingCredits} loading={isLoading} />

            {/* 2. Billing Cycle Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, !isAnnual && styles.toggleBtnActive]}
                onPress={() => setIsAnnual(false)}
              >
                <Text style={[styles.toggleText, !isAnnual && styles.toggleTextActive]}>Monthly Billing</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, isAnnual && styles.toggleBtnActive]}
                onPress={() => setIsAnnual(true)}
              >
                <Text style={[styles.toggleText, isAnnual && styles.toggleTextActive]}>Annual Billing (Save 20%)</Text>
              </TouchableOpacity>
            </View>

            {/* 3. Subscription Packages */}
            <View style={[styles.cardsWrapper, isDesktop && styles.cardsWrapperDesktop]}>
              {displayPlans.map((plan) => (
                <View key={plan.id || plan.planKey} style={[styles.planCardContainer, isDesktop && styles.planCardContainerDesktop]}>
                  <PlanCard
                    plan={plan}
                    isAnnual={isAnnual}
                    currentPlan={currentPlan}
                    subscribingPlanKey={subscribingPlanKey}
                    isTopUpProcessing={isTopUpProcessing}
                    onSubscribe={handleSubscribe}
                  />
                </View>
              ))}
            </View>

            {/* 4. Calculator Card */}
            <CalculatorCard
              expectedAITasks={expectedAITasks}
              additionalUnits={additionalUnits}
              isAnnual={isAnnual}
              width={width}
              setExpectedAITasks={setExpectedAITasks}
              setAdditionalUnits={setAdditionalUnits}
            />

            {/* 5. Prepaid Top-Up Card */}
            <TopUpCard
              topUpAmount={topUpAmount}
              isTopUpProcessing={isTopUpProcessing}
              subscribingPlanKey={subscribingPlanKey}
              setTopUpAmount={setTopUpAmount}
              onTopUp={handleTopUp}
            />

          </View>
          <View style={{ height: 120 }} />
    </PageShell>
  );
}

const createStyles = (theme: any, isDark: boolean, isDesktop: boolean = false) => StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    zIndex: 999,
    borderBottomWidth: 1.5,
    borderBottomColor: theme.Colors.glassFill,
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.Spacing.md,
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: theme.Colors.glassFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.bodyLarge.fontSize,
    fontWeight: '600',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 40,
  },
  titleContainer: {
    marginTop: isDesktop ? 20 : theme.Spacing.lg,
    marginBottom: theme.Spacing.lg,
  },
  titleLineDesktop: {
    ...theme.Typography.headlineLg,
    color: theme.Colors.onSurface,
  },
  subtitleDesktop: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: theme.Spacing.xs,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.Colors.surfaceContainerLow,
    padding: 6,
    borderRadius: 16,
    marginVertical: 15,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: theme.Colors.surfaceContainerLowest,
    shadowColor: theme.Colors.onSurface,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: theme.Colors.primary,
  },
  cardsWrapper: {
    flexDirection: 'column',
    width: '100%',
  },
  cardsWrapperDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  planCardContainer: {
    width: '100%',
  },
  planCardContainerDesktop: {
    width: '31%',
    minWidth: 280,
  },
  desktopInner: {
    width: '100%',
    flex: 1,
  },
});
