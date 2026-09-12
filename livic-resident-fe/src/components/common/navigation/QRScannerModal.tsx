import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function QRScannerModal({ visible, onClose }: QRScannerModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const mediaStreamRef = useRef<any>(null);

  const laserAnim = useRef(new Animated.Value(0)).current;

  const startCamera = async () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        console.warn('Camera access requires HTTPS or localhost');
        setHasPermission(false);
        return;
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } }
          });
          mediaStreamRef.current = stream;
          setHasPermission(true);
        } catch (err) {
          console.warn('Camera permission denied or camera unavailable:', err);
          setHasPermission(false);
        }
      } else {
        setHasPermission(false);
      }
    } else {
      if (!permission?.granted) {
        const res = await requestPermission();
        setHasPermission(res.granted);
      } else {
        setHasPermission(true);
      }
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track: any) => track.stop());
      } catch (_e) {}
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setScannedData(null);
      startCamera();

      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 200,
            duration: 1800,
            useNativeDriver: false,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [visible]);

  const handleSimulateScan = (code: string) => {
    setScanned(true);
    setScannedData(code);

    setTimeout(() => {
      onClose();
      if (code.startsWith('/')) {
        router.push(code as any);
      } else {
        router.push('/tenant-home' as any);
      }
    }, 1200);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    handleSimulateScan(data);
  };

  if (!visible) return null;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Fullscreen Camera Preview Background */}
        {Platform.OS === 'web' ? (
          <video
            ref={(node) => {
              if (node && mediaStreamRef.current) {
                node.srcObject = mediaStreamRef.current;
                node.play().catch(() => {});
              }
            }}
            autoPlay
            playsInline
            muted
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          hasPermission && (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />
          )
        )}

        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]} />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
            <MaterialIcons name="close" size={24} color={theme.Colors.surfaceContainerLowest} />
          </TouchableOpacity>
        </View>

        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {!scanned && (
              <Animated.View
                style={[
                  styles.laserLine,
                  {
                    transform: [{ translateY: laserAnim }],
                  },
                ]}
              />
            )}

            {scanned && (
              <View style={styles.scannedOverlay}>
                <MaterialIcons name="check-circle" size={48} color="#00E676" />
                <Text style={styles.scannedText}>Code Verified!</Text>
                <Text style={styles.scannedSubtext}>{scannedData}</Text>
              </View>
            )}
          </View>

          <Text style={styles.instructionText}>
            Align the QR code within the frame to automatically scan unit or payment details
          </Text>

          {hasPermission === false && (
            <TouchableOpacity style={styles.retryCameraBtn} onPress={startCamera} activeOpacity={0.8}>
              <MaterialIcons name="videocam" size={20} color={theme.Colors.surfaceContainerLowest} />
              <Text style={styles.retryCameraText}>Enable Camera Access</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.shortcutSection}>
          <Text style={styles.shortcutTitle}>Test Quick Scans:</Text>
          <View style={styles.shortcutRow}>
            <TouchableOpacity
              style={styles.shortcutChip}
              onPress={() => handleSimulateScan('/tenant-home')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="home" size={16} color="#00D8F6" />
              <Text style={styles.shortcutText}>My Unit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutChip}
              onPress={() => handleSimulateScan('/tenant-payments')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="payments" size={16} color="#00D8F6" />
              <Text style={styles.shortcutText}>Rent Invoice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(5, 12, 18, 0.92)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: theme.Spacing.lg,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
  },
  headerTitle: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '700',
    color: theme.Colors.surfaceContainerLowest,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderContainer: {
    alignItems: 'center',
    width: '100%',
  },
  viewfinder: {
    width: 260,
    height: 260,
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 216, 246, 0.5)',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: theme.Colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  laserLine: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: theme.Colors.primary,
    borderRadius: 2,
    shadowColor: theme.Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  scannedOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(10, 25, 35, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.Spacing.sm,
  },
  scannedText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.bodyLg.fontSize,
    fontWeight: '700',
  },
  scannedSubtext: {
    color: theme.Colors.primary,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: theme.Typography.bodyMedium.fontSize,
    textAlign: 'center',
    marginTop: theme.Spacing.lg,
    maxWidth: 280,
    lineHeight: 18,
  },
  retryCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    marginTop: theme.Spacing.md,
    backgroundColor: theme.Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: theme.Spacing.md,
    borderRadius: 20,
  },
  retryCameraText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  shortcutSection: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  shortcutTitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: theme.Typography.bodySmall.fontSize,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  shortcutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: theme.Spacing.sm,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  shortcutText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
});
