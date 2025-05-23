import { BORDER_RADIUS, COLORS, FONTS, FONT_SIZES, SPACING } from "@/app/theme";
import { GOOGLE_API_KEY } from "@/constant";
import { useTheme } from "@/contexts/ThemeContext";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from "react-native";
import Translate from "../Translate";
import { useTranslator } from "@/contexts/TranslatorContext";

// Custom light theme secondary color - to match Input
const LIGHT_THEME_ACCENT = "#FF0099";

interface LocationPickerProps {
  label?: string;
  placeholder?: string;
  value?: string | null;
  onSelect: (data: any) => void;
  containerStyle?: ViewStyle;
  error?: string;
  countryCode?: string | null;
  regionCode?: string | null;
  isDarkMode?: boolean; // Allow overriding the theme context
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  label = "Address",
  placeholder = "Enter your address",
  value = "",
  onSelect,
  containerStyle,
  error,
  countryCode = null,
  regionCode = null,
  isDarkMode: forceDarkMode,
}) => {
  const { isDarkMode: contextDarkMode } = useTheme();
  const isDarkMode =
    forceDarkMode !== undefined ? forceDarkMode : contextDarkMode;

  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [recentAddresses, setRecentAddresses] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  const [inputPlaceholder, setInputPlaceholder] = useState<string>("");

  const { translateText } = useTranslator();

  useEffect(() => {
    const translate = async () => {
      const translatedInput = await translateText("Enter your address");
      setInputPlaceholder(translatedInput);
    };

    translate();
  }, []);

  // Add a ref for the text input to maintain focus
  const textInputRef = useRef<TextInput>(null);

  // Check if location picker is enabled (requires country and region)
  const isEnabled = countryCode && regionCode;

  // Handle modal open/close
  useEffect(() => {
    if (showModal) {
      setSearchText("");
      setGeocodingError(null);
      // Focus the input when modal opens
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  }, [showModal]);

  // Format display text
  const getDisplayText = () => {
    if (!isEnabled) return "Select country and region first";
    if (!value) return placeholder;
    return value;
  };

  // Theme-based styles (matching Input component)
  const getTextColor = () =>
    isDarkMode ? COLORS.DARK_TEXT_PRIMARY : COLORS.LIGHT_TEXT_PRIMARY;

  const getPlaceholderColor = () =>
    isDarkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.35)";

  const getLabelColor = () =>
    isDarkMode ? COLORS.SECONDARY : LIGHT_THEME_ACCENT;

  const getBackgroundColor = () =>
    isDarkMode
      ? isFocused
        ? "rgba(40, 45, 55, 0.65)"
        : "rgba(30, 35, 45, 0.5)"
      : isFocused
      ? "rgba(255, 255, 255, 0.65)"
      : "rgba(255, 255, 255, 0.5)";

  const getBorderColor = () =>
    isDarkMode
      ? isFocused
        ? COLORS.SECONDARY
        : "rgba(255, 255, 255, 0.1)"
      : isFocused
      ? LIGHT_THEME_ACCENT
      : "rgba(0, 0, 0, 0.05)";

  const getAccentColor = () =>
    isDarkMode ? COLORS.SECONDARY : LIGHT_THEME_ACCENT;

  const handleOpenModal = () => {
    if (isEnabled) {
      setIsFocused(true);
      setGeocodingError(null);
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setGeocodingError(null);
    setIsFocused(false);
    setSearchText("");
  };

  // Geocode the address using Google Geocoding API directly
  const geocodeAddress = async (address: string) => {
    if (!address.trim()) return;

    try {
      setGeocoding(true);
      setGeocodingError(null);

      // Create a more specific address by adding country and region
      const fullAddress = `${address}, ${regionCode}, ${countryCode}`;

      // Check if Google API key is provided
      if (!GOOGLE_API_KEY) {
        throw new Error("Google API key is required for geocoding");
      }

      // Call Google Geocoding API directly
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        fullAddress
      )}&key=${GOOGLE_API_KEY}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Network error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];

        // Extract the coordinates
        const { lat, lng } = result.geometry.location;

        const locationData = {
          description: address,
          formattedAddress: result.formatted_address,
          geometry: {
            location: {
              lat,
              lng,
            },
          },
          address_components: result.address_components,
        };

        // Store in recent addresses
        const newRecentAddresses = [
          address,
          ...recentAddresses.filter((addr) => addr !== address),
        ].slice(0, 5);
        setRecentAddresses(newRecentAddresses);

        onSelect(locationData);
        handleCloseModal();
      } else {
        // Handle error based on status
        switch (data.status) {
          case "ZERO_RESULTS":
            setGeocodingError(
              "No location found for this address. Please check the spelling or try a more specific address."
            );
            break;
          case "OVER_QUERY_LIMIT":
            setGeocodingError("Too many requests. Please try again later.");
            break;
          case "REQUEST_DENIED":
            setGeocodingError("Request denied. Please check your API key.");
            break;
          case "INVALID_REQUEST":
            setGeocodingError(
              "Invalid request. Please check the address format."
            );
            break;
          default:
            setGeocodingError(`Error finding location: ${data.status}`);
        }
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setGeocodingError(
        "Error connecting to geocoding service. Please check your connection and try again."
      );
    } finally {
      setGeocoding(false);
    }
  };

  // Handle text change
  const handleTextChange = (text: string) => {
    setSearchText(text);
    // Clear any previous geocoding errors when user types
    if (geocodingError) {
      setGeocodingError(null);
    }
  };

  // Handle recent address selection
  const handleRecentAddressSelect = (address: string) => {
    setSearchText(address);
  };

  // Render recent address item
  const renderRecentItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.recentItem,
        {
          borderBottomColor: isDarkMode
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.05)",
        },
      ]}
      onPress={() => handleRecentAddressSelect(item)}
    >
      <FontAwesome
        name="history"
        size={16}
        color={
          isDarkMode ? COLORS.DARK_TEXT_SECONDARY : COLORS.LIGHT_TEXT_SECONDARY
        }
        style={styles.recentIcon}
      />
      <Text
        style={[styles.recentText, { color: getTextColor() }]}
        numberOfLines={1}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {label && (
        <Text style={[styles.inputLabel, { color: getLabelColor() }]}>
          <Translate>{label}</Translate>
        </Text>
      )}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderWidth: isFocused ? 1 : 0.5,
            opacity: !isEnabled ? 0.7 : 1,
          },
          error && styles.inputWrapperError,
        ]}
      >
        <View style={styles.iconContainer}>
          <FontAwesome
            name="map"
            size={16}
            color={
              !isEnabled
                ? isDarkMode
                  ? "rgba(255, 255, 255, 0.3)"
                  : "rgba(0, 0, 0, 0.2)"
                : isDarkMode
                ? COLORS.DARK_TEXT_SECONDARY
                : COLORS.LIGHT_TEXT_SECONDARY
            }
          />
        </View>

        <TouchableOpacity
          style={styles.pickerTouchable}
          onPress={handleOpenModal}
          activeOpacity={0.7}
          disabled={!isEnabled}
        >
          <Text
            style={[
              styles.selectedText,
              {
                color: !isEnabled
                  ? isDarkMode
                    ? "rgba(255, 255, 255, 0.3)"
                    : "rgba(0, 0, 0, 0.2)"
                  : value
                  ? getTextColor()
                  : getPlaceholderColor(),
              },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            <Translate>{getDisplayText()}</Translate>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.chevronContainer}
          onPress={handleOpenModal}
          activeOpacity={0.7}
          disabled={!isEnabled}
        >
          <FontAwesome
            name="chevron-down"
            size={12}
            color={
              !isEnabled
                ? isDarkMode
                  ? "rgba(255, 255, 255, 0.3)"
                  : "rgba(0, 0, 0, 0.2)"
                : isDarkMode
                ? COLORS.DARK_TEXT_SECONDARY
                : COLORS.LIGHT_TEXT_SECONDARY
            }
          />
        </TouchableOpacity>

        {/* Accent indicator for focused state */}
        {isFocused && (
          <View
            style={[
              styles.focusAccent,
              {
                backgroundColor: getAccentColor(),
              },
            ]}
          />
        )}
      </View>

      {error && (
        <Text style={[styles.errorText, { color: COLORS.ERROR }]}>
          <Translate>{error}</Translate>
        </Text>
      )}

      {/* Location Picker Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <TouchableWithoutFeedback onPress={handleCloseModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.modalContainer,
                  {
                    backgroundColor: isDarkMode
                      ? COLORS.DARK_BG_SECONDARY
                      : "#FFFFFF",
                  },
                ]}
              >
                {/* Fixed Header */}
                <View style={styles.modalHeaderContainer}>
                  <LinearGradient
                    colors={
                      isDarkMode
                        ? ["#111827", "#1F2937"]
                        : ["#FF0099", "#FF6D00"]
                    }
                    style={styles.gradientBackground}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />

                  <View
                    style={[
                      styles.modalHeader,
                      {
                        borderBottomColor: isDarkMode
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(0, 0, 0, 0.1)",
                      },
                    ]}
                  >
                    <Text style={[styles.modalTitle, { color: COLORS.WHITE }]}>
                      <Translate>Enter Address</Translate>
                    </Text>
                  </View>

                  {/* Search Input - Fixed outside of FlatList */}
                  <View
                    style={[
                      styles.searchContainer,
                      {
                        backgroundColor: isDarkMode
                          ? "rgba(40, 45, 55, 0.65)"
                          : "rgba(255, 255, 255, 0.8)",
                        borderColor: isDarkMode
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(0, 0, 0, 0.05)",
                      },
                    ]}
                  >
                    <FontAwesome
                      name="search"
                      size={16}
                      color={
                        isDarkMode
                          ? COLORS.DARK_TEXT_SECONDARY
                          : COLORS.LIGHT_TEXT_SECONDARY
                      }
                      style={styles.searchIcon}
                    />
                    <TextInput
                      ref={textInputRef}
                      style={[styles.searchInput, { color: getTextColor() }]}
                      placeholder={inputPlaceholder || "Enter your address"}
                      placeholderTextColor={getPlaceholderColor()}
                      value={searchText}
                      onChangeText={handleTextChange}
                      autoFocus={false}
                      returnKeyType="search"
                      onSubmitEditing={() => geocodeAddress(searchText)}
                    />
                    {searchText.length > 0 && (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setSearchText("")}
                      >
                        <FontAwesome
                          name="times-circle"
                          size={16}
                          color={getPlaceholderColor()}
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Error Message */}
                  {geocodingError && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorMessage}>
                        <Translate>{geocodingError}</Translate>
                      </Text>
                    </View>
                  )}

                  {/* Find Location Button */}
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      {
                        backgroundColor: isDarkMode
                          ? COLORS.SECONDARY
                          : LIGHT_THEME_ACCENT,
                        opacity: !searchText.trim() || geocoding ? 0.5 : 1,
                      },
                    ]}
                    onPress={() => geocodeAddress(searchText)}
                    disabled={!searchText.trim() || geocoding}
                  >
                    {geocoding ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.confirmButtonText}>
                        <Translate>Find Location</Translate>
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Recent Addresses List */}
                {recentAddresses.length > 0 && (
                  <View style={styles.recentSection}>
                    <Text
                      style={[
                        styles.recentTitle,
                        {
                          color: isDarkMode
                            ? COLORS.DARK_TEXT_SECONDARY
                            : COLORS.LIGHT_TEXT_SECONDARY,
                        },
                      ]}
                    >
                      <Translate>Recent Addresses</Translate>
                    </Text>

                    <FlatList
                      data={recentAddresses}
                      renderItem={renderRecentItem}
                      keyExtractor={(item, index) => `${item}-${index}`}
                      style={styles.addressList}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="always"
                    />
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: SPACING.M,
    width: "100%",
  },
  inputLabel: {
    fontSize: FONT_SIZES.XS,
    fontFamily: FONTS.MEDIUM,
    marginBottom: SPACING.XS,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    borderRadius: BORDER_RADIUS.L,
    overflow: "hidden",
    position: "relative",
  },
  focusAccent: {
    position: "absolute",
    left: 0,
    width: 3,
    height: "100%",
    borderTopRightRadius: BORDER_RADIUS.S,
    borderBottomRightRadius: BORDER_RADIUS.S,
  },
  inputWrapperError: {
    borderWidth: 1,
    borderColor: COLORS.ERROR,
  },
  iconContainer: {
    paddingHorizontal: SPACING.M,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerTouchable: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
  },
  selectedText: {
    fontSize: FONT_SIZES.XS,
    fontFamily: FONTS.REGULAR,
  },
  chevronContainer: {
    paddingHorizontal: SPACING.M,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: FONT_SIZES.XS,
    marginTop: SPACING.XS,
    paddingHorizontal: SPACING.XS,
    fontFamily: FONTS.REGULAR,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    height: Dimensions.get("window").height * 0.7,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  modalHeaderContainer: {
    backgroundColor: "transparent",
  },
  gradientBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    paddingVertical: SPACING.M,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: FONT_SIZES.M,
    fontFamily: FONTS.BOLD,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.M,
    margin: SPACING.M,
    paddingHorizontal: SPACING.S,
    height: 40,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: SPACING.S,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontFamily: FONTS.REGULAR,
    fontSize: FONT_SIZES.S,
  },
  clearButton: {
    padding: 4,
    marginLeft: SPACING.XS,
  },
  confirmButton: {
    borderRadius: BORDER_RADIUS.M,
    height: 40,
    marginHorizontal: SPACING.M,
    marginBottom: SPACING.M,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontSize: FONT_SIZES.S,
    fontFamily: FONTS.SEMIBOLD,
    color: COLORS.WHITE,
  },
  errorContainer: {
    marginHorizontal: SPACING.M,
    marginBottom: SPACING.M,
    padding: SPACING.S,
    backgroundColor: "rgba(255, 100, 100, 1)",
    borderRadius: BORDER_RADIUS.M,
  },
  errorMessage: {
    color: "#FFF",
    fontSize: FONT_SIZES.XS,
    fontFamily: FONTS.REGULAR,
    textAlign: "center",
  },
  recentSection: {
    flex: 1,
    paddingTop: SPACING.S,
  },
  recentTitle: {
    fontSize: FONT_SIZES.XS,
    fontFamily: FONTS.MEDIUM,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginHorizontal: SPACING.M,
    marginBottom: SPACING.XS,
  },
  addressList: {
    flex: 1,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.M,
    paddingHorizontal: SPACING.M,
    borderBottomWidth: 1,
  },
  recentIcon: {
    marginRight: SPACING.M,
  },
  recentText: {
    fontSize: FONT_SIZES.S,
    fontFamily: FONTS.REGULAR,
    flex: 1,
  },
});

export default LocationPicker;
