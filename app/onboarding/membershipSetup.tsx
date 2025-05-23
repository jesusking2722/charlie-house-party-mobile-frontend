import {
  Currency,
  LanguageToggleGroup,
  MembershipRadioGroup,
  PaymentMethodType,
  Spinner,
  SubscriptionPlan,
  Translate,
} from "@/components/common";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  ANIMATIONS,
  BORDER_RADIUS,
  COLORS,
  FONTS,
  FONT_SIZES,
  GRADIENTS,
  SHADOWS,
  SPACING,
} from "@/app/theme";
import {
  Button,
  CardPayment,
  CryptoPayment,
  PaymentModal,
  ThemeToggle,
} from "@/components/common";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { updateAuthUser } from "@/lib/scripts/auth.scripts";
import { setAuthUserAsync } from "@/redux/actions/auth.actions";
import { RootState, useAppDispatch } from "@/redux/store";
import { User } from "@/types/data";
import { useSelector } from "react-redux";

const PremiumHeaderImage = require("@/assets/images/premium_onboarding.png");
const { width, height } = Dimensions.get("window");

// Custom light theme secondary color
const LIGHT_THEME_ACCENT = "#FF0099";

const PremiumSubscriptionScreen = () => {
  const { isDarkMode } = useTheme();

  // Subscription plans data
  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "free",
      title: "Free",
      price: 0,
      priceLabel: "Free for now",
      duration: "Lifetime",
      isFree: true,
      features: ["Basic features", "Limited access"],
      limitations: ["Limited features", "Standard support"],
    },
    {
      id: "monthly",
      title: "1 Month",
      price: 12,
      priceLabel: "$12 / month",
      duration: "1 month",
      features: ["All premium features", "Cancel anytime"],
    },
    {
      id: "quarterly",
      title: "3 Months",
      price: 30,
      priceLabel: "$30 / 3 months",
      duration: "3 months",
      features: ["All premium features", "Priority support"],
    },
    {
      id: "biannual",
      title: "6 Months",
      price: 54,
      priceLabel: "$54 / 6 months",
      duration: "6 months",
      isPopular: true,
      features: [
        "All premium features",
        "Priority support",
        "Exclusive content",
      ],
    },
    {
      id: "annual",
      title: "12 Months",
      price: 95,
      priceLabel: "$95 / 1 year",
      duration: "1 year",
      features: [
        "All premium features",
        "Priority support",
        "Exclusive content",
        "Yearly bonus",
      ],
    },
  ];

  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    subscriptionPlans[3].id
  );
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("USD");
  const [formattedAmount, setFormattedAmount] = useState<string>("$54");
  const [loading, setLoading] = useState<boolean>(false);
  const [paymentModalVisible, setPaymentModalVisible] =
    useState<boolean>(false);
  const [paymentFlow, setPaymentFlow] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const cardScale = useRef(new Animated.Value(0.97)).current;
  const buttonScale = useRef(new Animated.Value(0)).current;

  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();

  const { showToast } = useToast();

  // Particle animations for the background
  const particles = Array(6)
    .fill(0)
    .map(() => ({
      x: useRef(new Animated.Value(Math.random() * width)).current,
      y: useRef(new Animated.Value(Math.random() * height * 0.4)).current,
      scale: useRef(new Animated.Value(Math.random() * 0.4 + 0.3)).current,
      opacity: useRef(new Animated.Value(Math.random() * 0.4 + 0.2)).current,
      speed: Math.random() * 3000 + 2000,
    }));

  // Run animations when component mounts
  useEffect(() => {
    const animationDelay = Platform.OS === "ios" ? 200 : 300;

    // Main elements fade in
    setTimeout(() => {
      Animated.parallel([
        // Fade in entire view
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATIONS.MEDIUM,
          useNativeDriver: true,
        }),
        // Slide up animation
        Animated.spring(translateY, {
          toValue: 0,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        // Card scale animation
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 60,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();

      // Button animation
      Animated.sequence([
        Animated.delay(animationDelay),
        Animated.spring(buttonScale, {
          toValue: 1,
          tension: 60,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();

      // Start particle animations
      animateParticles();
    }, 100);
  }, []);

  // Initialize formattedAmount with default selected plan
  useEffect(() => {
    const selectedPlan = subscriptionPlans.find(
      (plan) => plan.id === selectedPlanId
    );
    if (selectedPlan && !selectedPlan.isFree) {
      // Extract just the price part (e.g. "$54" from "$54 / 6 months")
      const priceMatch = selectedPlan.priceLabel.match(/\$\d+/);
      if (priceMatch) {
        setFormattedAmount(priceMatch[0]);
      }
    }
  }, []);

  // Continuous animation for floating particles
  const animateParticles = () => {
    particles.forEach((particle) => {
      // Animate vertical position
      Animated.loop(
        Animated.sequence([
          Animated.timing(particle.y, {
            toValue: Math.random() * (height * 0.3) + height * 0.05,
            duration: particle.speed,
            useNativeDriver: true,
            easing: (t) => Math.sin(t * Math.PI),
          }),
          Animated.timing(particle.y, {
            toValue: Math.random() * (height * 0.3) + height * 0.05,
            duration: particle.speed,
            useNativeDriver: true,
            easing: (t) => Math.sin(t * Math.PI),
          }),
        ])
      ).start();

      // Animate scale
      Animated.loop(
        Animated.sequence([
          Animated.timing(particle.scale, {
            toValue: Math.random() * 0.3 + 0.4,
            duration: particle.speed * 1.1,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: Math.random() * 0.3 + 0.4,
            duration: particle.speed * 1.1,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animate opacity
      Animated.loop(
        Animated.sequence([
          Animated.timing(particle.opacity, {
            toValue: Math.random() * 0.2 + 0.2,
            duration: particle.speed * 0.8,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: Math.random() * 0.2 + 0.2,
            duration: particle.speed * 0.8,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  };

  // Handle plan selection
  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlanId(plan.id);
  };

  // Handle currency change
  const handleCurrencyChange = (currency: Currency, formattedPrice: string) => {
    setSelectedCurrency(currency);
    setFormattedAmount(formattedPrice);
  };

  // Handle subscription submission
  const handleSubscribe = () => {
    const selectedPlan = subscriptionPlans.find(
      (plan) => plan.id === selectedPlanId
    );

    // If free plan is selected, proceed to next step without payment
    if (selectedPlan?.isFree) {
      handleFreeSubscription();
    } else {
      // Show payment modal for paid plans
      setPaymentModalVisible(true);
    }
  };

  // Handle free subscription
  const handleFreeSubscription = () => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      router.push("/onboarding/congratulationsSetup");
    }, 1000);
  };

  // Handle payment method selection
  const handleSelectPaymentMethod = (method: PaymentMethodType) => {
    setPaymentModalVisible(false);

    // Set the payment flow based on the selected method
    if (method === PaymentMethodType.CRYPTO) {
      setPaymentFlow("crypto");
    } else if (method === PaymentMethodType.CARD) {
      setPaymentFlow("card");
    }
  };

  // Handle payment completion
  const handlePaymentComplete = async (success: boolean) => {
    if (success && user) {
      setLoading(true);
      setPaymentFlow(null);

      try {
        const updatingUser: User = {
          ...user,
          membership: "premium",
          membershipPeriod: Number(selectedPlan?.duration.split(" ")[0]) as any,
          premiumStartedAt: new Date(),
        };

        const response = await updateAuthUser(updatingUser);
        if (response.ok) {
          const { user: updatedUser } = response.data;
          await dispatch(setAuthUserAsync(updatedUser)).unwrap();
          router.push("/onboarding/congratulationsSetup");
        }
      } catch (error) {
        showToast("Something went wrong", "error");
        console.error(
          "handle premium membership payment complete error: ",
          error
        );
      } finally {
        setLoading(false);
      }
    } else {
      setPaymentFlow(null);
      showToast("Failed", "error");
    }
  };

  // Handle back from payment flow
  const handleBackFromPayment = () => {
    setPaymentFlow(null);
  };

  // Get the selected plan
  const selectedPlan = subscriptionPlans.find(
    (plan) => plan.id === selectedPlanId
  );

  // Helper function to get accent color based on theme
  const getAccentColor = () =>
    isDarkMode ? COLORS.SECONDARY : LIGHT_THEME_ACCENT;

  // Render particles for background effect
  const renderParticles = () => {
    return particles.map((particle, index) => (
      <Animated.View
        key={`particle-${index}`}
        style={[
          styles.particle,
          {
            transform: [
              { translateX: particle.x },
              { translateY: particle.y },
              { scale: particle.scale },
            ],
            opacity: particle.opacity,
            backgroundColor: isDarkMode
              ? `rgba(${127 + Math.floor(Math.random() * 128)}, ${Math.floor(
                  Math.random() * 100
                )}, ${Math.floor(Math.random() * 255)}, 0.7)`
              : `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
                  Math.random() * 255
                )}, ${Math.floor(Math.random() * 255)}, 0.5)`,
          },
        ]}
      />
    ));
  };

  // If in a payment flow, render the appropriate payment component
  if (paymentFlow === "card") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <CardPayment
          type="subscription"
          amount={selectedPlan?.price.toString() || ""}
          formattedAmount={formattedAmount}
          currency={selectedCurrency}
          planTitle={selectedPlan?.title || ""}
          onPaymentComplete={handlePaymentComplete}
          onBack={handleBackFromPayment}
        />
      </SafeAreaView>
    );
  }

  if (paymentFlow === "crypto") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <CryptoPayment
          type="subscription"
          amount={selectedPlan?.price.toString() || ""}
          formattedAmount={formattedAmount}
          currency={selectedCurrency}
          planTitle={selectedPlan?.title || ""}
          onPaymentComplete={handlePaymentComplete}
          onBack={handleBackFromPayment}
        />
      </SafeAreaView>
    );
  }

  // Main subscription screen
  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.DARK_BG : COLORS.LIGHT_BG },
      ]}
    >
      <StatusBar style="light" />

      <Spinner visible={loading} message="Subscribing..." />

      {/* Theme toggle button */}
      <View style={styles.themeToggle}>
        <ThemeToggle />
        <LanguageToggleGroup containerStyle={{ marginRight: SPACING.M }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header Image Section */}
          <View style={styles.headerImageContainer}>
            <Image
              source={PremiumHeaderImage}
              style={styles.headerImage}
              resizeMode="cover"
            />

            {/* Add floating particles for fun effect */}
            {renderParticles()}

            {/* Overlay gradient for readability */}
            <LinearGradient
              colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0)"]}
              style={styles.imageOverlay}
            />
          </View>

          {/* Bottom Half with Animated Background */}
          <View style={styles.bottomHalf}>
            <LinearGradient
              colors={isDarkMode ? GRADIENTS.DARK_BG : GRADIENTS.LIGHT_BG}
              style={styles.bottomGradient}
            />

            {/* Content Card */}
            <Animated.View
              style={[
                styles.cardContainer,
                {
                  transform: [{ translateY: translateY }, { scale: cardScale }],
                  opacity: fadeAnim,
                },
              ]}
            >
              <BlurView
                intensity={isDarkMode ? 40 : 30}
                tint={isDarkMode ? "dark" : "light"}
                style={styles.cardBlur}
              >
                <LinearGradient
                  colors={isDarkMode ? GRADIENTS.DARK_BG : GRADIENTS.LIGHT_BG}
                  style={styles.cardGradient}
                >
                  {/* Accent Bar */}
                  <View
                    style={[
                      styles.cardAccentBar,
                      {
                        backgroundColor: getAccentColor(),
                      },
                    ]}
                  />

                  <View style={styles.cardContent}>
                    <Text
                      style={[
                        styles.welcomeText,
                        {
                          color: isDarkMode
                            ? COLORS.DARK_TEXT_PRIMARY
                            : COLORS.LIGHT_TEXT_PRIMARY,
                        },
                      ]}
                    >
                      <Translate>Upgrade to Premium</Translate>
                    </Text>
                    <Text
                      style={[
                        styles.subtitleText,
                        {
                          color: isDarkMode
                            ? COLORS.DARK_TEXT_SECONDARY
                            : COLORS.LIGHT_TEXT_SECONDARY,
                        },
                      ]}
                    >
                      <Translate>
                        Unlock all features and enhance your experience
                      </Translate>
                    </Text>

                    {/* Premium Features */}
                    <View
                      style={[
                        styles.featuresContainer,
                        {
                          backgroundColor: isDarkMode
                            ? "rgba(40, 45, 55, 0.5)"
                            : "rgba(255, 255, 255, 0.5)",
                          borderColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(0, 0, 0, 0.05)",
                        },
                      ]}
                    >
                      <View style={styles.featureItem}>
                        <View
                          style={[
                            styles.featureIconContainer,
                            {
                              backgroundColor: isDarkMode
                                ? "rgba(255, 0, 153, 0.2)"
                                : "rgba(255, 0, 153, 0.1)",
                            },
                          ]}
                        >
                          <FontAwesome
                            name="check-circle"
                            size={18}
                            color={getAccentColor()}
                          />
                        </View>
                        <Text
                          style={[
                            styles.featureText,
                            {
                              color: isDarkMode
                                ? COLORS.DARK_TEXT_PRIMARY
                                : COLORS.LIGHT_TEXT_PRIMARY,
                            },
                          ]}
                        >
                          <Translate>
                            Unlimited access to all features
                          </Translate>
                        </Text>
                      </View>

                      <View style={styles.featureItem}>
                        <View
                          style={[
                            styles.featureIconContainer,
                            {
                              backgroundColor: isDarkMode
                                ? "rgba(255, 0, 153, 0.2)"
                                : "rgba(255, 0, 153, 0.1)",
                            },
                          ]}
                        >
                          <FontAwesome
                            name="check-circle"
                            size={18}
                            color={getAccentColor()}
                          />
                        </View>
                        <Text
                          style={[
                            styles.featureText,
                            {
                              color: isDarkMode
                                ? COLORS.DARK_TEXT_PRIMARY
                                : COLORS.LIGHT_TEXT_PRIMARY,
                            },
                          ]}
                        >
                          <Translate>
                            Create events without KYC verification
                          </Translate>
                        </Text>
                      </View>

                      <View style={styles.featureItem}>
                        <View
                          style={[
                            styles.featureIconContainer,
                            {
                              backgroundColor: isDarkMode
                                ? "rgba(255, 0, 153, 0.2)"
                                : "rgba(255, 0, 153, 0.1)",
                            },
                          ]}
                        >
                          <FontAwesome
                            name="check-circle"
                            size={18}
                            color={getAccentColor()}
                          />
                        </View>
                        <Text
                          style={[
                            styles.featureText,
                            {
                              color: isDarkMode
                                ? COLORS.DARK_TEXT_PRIMARY
                                : COLORS.LIGHT_TEXT_PRIMARY,
                            },
                          ]}
                        >
                          <Translate>Priority customer support</Translate>
                        </Text>
                      </View>
                    </View>

                    {/* Subscription Plan Selection */}
                    <View style={styles.subscriptionContainer}>
                      <Text
                        style={[
                          styles.subscriptionTitle,
                          {
                            color: isDarkMode
                              ? COLORS.DARK_TEXT_PRIMARY
                              : COLORS.LIGHT_TEXT_PRIMARY,
                          },
                        ]}
                      >
                        <Translate>Choose your plan</Translate>
                      </Text>

                      <MembershipRadioGroup
                        plans={subscriptionPlans}
                        currentPlanId="free"
                        selectedPlanId={selectedPlanId}
                        onPlanSelect={handlePlanSelect}
                        onCurrencyChange={handleCurrencyChange}
                      />
                    </View>

                    {/* Progress Indicator */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressHeader}>
                        <Text
                          style={[
                            styles.progressText,
                            {
                              color: isDarkMode
                                ? COLORS.DARK_TEXT_SECONDARY
                                : COLORS.LIGHT_TEXT_SECONDARY,
                            },
                          ]}
                        >
                          <Translate>Membership Setup</Translate>
                        </Text>
                        <Text
                          style={[
                            styles.progressStep,
                            {
                              color: getAccentColor(),
                            },
                          ]}
                        >
                          <Translate>Step 4 of 4</Translate>
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.progressBarContainer,
                          {
                            backgroundColor: isDarkMode
                              ? "rgba(255, 255, 255, 0.1)"
                              : "rgba(0, 0, 0, 0.05)",
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: "100%", // 4 of 4 steps
                            },
                          ]}
                        >
                          <LinearGradient
                            colors={
                              isDarkMode
                                ? GRADIENTS.PRIMARY
                                : ["#FF0099", "#FF6D00"]
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.progressGradient}
                          />
                        </View>
                      </View>
                    </View>

                    {/* Subscribe Button */}
                    <Animated.View
                      style={{
                        width: "100%",
                        transform: [{ scale: buttonScale }],
                        marginTop: SPACING.M,
                      }}
                    >
                      <Button
                        title={
                          selectedPlan?.isFree
                            ? "Continue with Free Plan"
                            : `Subscribe for ${formattedAmount}`
                        }
                        onPress={handleSubscribe}
                        loading={loading}
                        variant={isDarkMode ? "primary" : "secondary"}
                        small={false}
                        icon={
                          !loading && (
                            <FontAwesome5
                              name="arrow-right"
                              size={14}
                              color="white"
                              style={{ marginLeft: SPACING.S }}
                            />
                          )
                        }
                        iconPosition="right"
                      />

                      <Button
                        title="Continue with Free"
                        variant="ghost"
                        onPress={() =>
                          router.push("/onboarding/congratulationsSetup")
                        }
                      />
                    </Animated.View>

                    {/* Terms Text */}
                    <Text
                      style={[
                        styles.termsText,
                        {
                          color: isDarkMode
                            ? "rgba(255, 255, 255, 0.4)"
                            : "rgba(0, 0, 0, 0.4)",
                        },
                      ]}
                    >
                      <Translate>
                        By subscribing, you agree to our Terms of Service and
                        Privacy Policy. Subscriptions automatically renew unless
                        auto-renew is turned off at least 24 hours before the
                        end of the current period.
                      </Translate>
                    </Text>
                  </View>
                </LinearGradient>
              </BlurView>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Payment Method Selection Modal */}
      <PaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        onSelectPaymentMethod={handleSelectPaymentMethod}
        amount={formattedAmount}
        currency={selectedCurrency}
        planTitle={selectedPlan?.title || ""}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerImageContainer: {
    height: height * 0.4,
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  particle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  imageOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
  },
  bottomHalf: {
    minHeight: height * 0.75,
    width: "100%",
    position: "relative",
    paddingBottom: SPACING.XL,
  },
  bottomGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardContainer: {
    position: "relative",
    top: -height * 0.06,
    marginHorizontal: width * 0.05,
    width: width * 0.9,
    zIndex: 10,
    height: "auto",
    borderRadius: BORDER_RADIUS.XXL,
    overflow: "hidden",
    ...SHADOWS.MEDIUM,
  },
  cardBlur: {
    width: "100%",
    height: "100%",
  },
  cardGradient: {
    width: "100%",
    height: "100%",
    borderRadius: BORDER_RADIUS.XXL,
    overflow: "hidden",
  },
  cardAccentBar: {
    height: 6,
    width: "100%",
    borderTopLeftRadius: BORDER_RADIUS.XXL,
    borderTopRightRadius: BORDER_RADIUS.XXL,
  },
  cardContent: {
    padding: SPACING.M,
  },
  welcomeText: {
    fontFamily: FONTS.BOLD,
    fontSize: FONT_SIZES.XL,
    marginBottom: SPACING.XS,
  },
  subtitleText: {
    fontFamily: FONTS.REGULAR,
    fontSize: FONT_SIZES.S,
    marginBottom: SPACING.M,
  },
  featuresContainer: {
    padding: SPACING.M,
    borderRadius: BORDER_RADIUS.L,
    borderWidth: 0.5,
    marginBottom: SPACING.M,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.S,
  },
  featureIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.S,
  },
  featureText: {
    fontFamily: FONTS.REGULAR,
    fontSize: FONT_SIZES.XS,
    flex: 1,
  },
  subscriptionContainer: {
    marginBottom: SPACING.M,
  },
  subscriptionTitle: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: FONT_SIZES.S,
    marginBottom: SPACING.S,
  },
  progressContainer: {
    marginTop: SPACING.M,
    marginBottom: SPACING.S,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.XS,
  },
  progressText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: FONT_SIZES.XS,
  },
  progressStep: {
    fontFamily: FONTS.BOLD,
    fontSize: FONT_SIZES.XS,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: BORDER_RADIUS.S,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  progressGradient: {
    flex: 1,
  },
  skipButton: {
    alignSelf: "center",
    marginTop: SPACING.M,
    padding: SPACING.S,
  },
  skipButtonText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: FONT_SIZES.XS,
  },
  termsText: {
    fontFamily: FONTS.REGULAR,
    fontSize: FONT_SIZES.XS,
    textAlign: "center",
    marginTop: SPACING.M,
    lineHeight: 16,
  },
  themeToggle: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 40,
    right: 20,
    zIndex: 100,
    display: "flex",
    flexDirection: "row",
    gap: 4,
  },
});

export default PremiumSubscriptionScreen;
