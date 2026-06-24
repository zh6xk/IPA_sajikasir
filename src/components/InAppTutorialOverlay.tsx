import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Text, Button, useTheme, Card, IconButton } from 'react-native-paper';
import Svg, { Defs, Mask, Rect, Circle, RRect } from 'react-native-svg';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface TutorialStep {
  title: string;
  description: string;
  targetRef: React.RefObject<any> | null;
}

interface Props {
  isVisible: boolean;
  steps: TutorialStep[];
  onFinish: () => void;
  onSkip: () => void;
  onStepChange?: (index: number) => void;
}

export const InAppTutorialOverlay = ({ isVisible, steps, onFinish, onSkip, onStepChange }: Props) => {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetLayout, setTargetLayout] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible && steps.length > 0 && currentIndex < steps.length && !showConfetti) {
      if (onStepChange) onStepChange(currentIndex);
      measureCurrentStep();
    }
  }, [isVisible, currentIndex, steps, showConfetti]);

  const measureCurrentStep = () => {
    const step = steps[currentIndex];
    if (step && step.targetRef && step.targetRef.current) {
      // Need a small timeout to ensure layout/scroll animation is complete
      setTimeout(() => {
        step.targetRef!.current.measureInWindow((x: number, y: number, width: number, height: number) => {
          setTargetLayout({ x, y, width, height });
        });
      }, 400);
    } else {
      // If no ref, place in center
      setTargetLayout({
        x: SCREEN_WIDTH / 2 - 50,
        y: SCREEN_HEIGHT / 2 - 50,
        width: 100,
        height: 100
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Finish
      setShowConfetti(true);
      setTargetLayout(null); // Hide spotlight
    }
  };

  const handleConfettiFinish = () => {
    setShowConfetti(false);
    onFinish();
  };

  if (!isVisible) return null;

  const currentStep = steps[currentIndex] || steps[0];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* SVG Overlay */}
      {!showConfetti && (
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <Mask id="spotlight-mask">
              <Rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetLayout && (
                <Rect
                  x={targetLayout.x - 8}
                  y={targetLayout.y - 8}
                  width={targetLayout.width + 16}
                  height={targetLayout.height + 16}
                  rx="16"
                  ry="16"
                  fill="black"
                />
              )}
            </Mask>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </Svg>
      )}

      {/* Confetti overlay instead of Spotlight when done */}
      {showConfetti && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <ConfettiCannon
            count={200}
            origin={{ x: SCREEN_WIDTH / 2, y: -20 }}
            autoStart={true}
            fadeOut={true}
            fallSpeed={3000}
            onAnimationEnd={handleConfettiFinish}
          />
          <View style={styles.confettiContent}>
            <Text variant="displaySmall" style={styles.celebrateTitle}>Luar Biasa!</Text>
            <Text variant="bodyLarge" style={styles.celebrateText}>Anda siap menggunakan SajiKasir. Selamat mengelola toko!</Text>
          </View>
        </View>
      )}

      {/* UI Elements */}
      {!showConfetti && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Header Progress & Skip */}
          <View style={styles.header}>
            <View style={styles.progressContainer}>
              {steps.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.progressDot,
                    { backgroundColor: idx === currentIndex ? theme.colors.primaryContainer : 'rgba(255,255,255,0.3)' },
                    idx === currentIndex && styles.progressDotActive
                  ]}
                />
              ))}
            </View>
            <Button mode="text" textColor="white" onPress={onSkip}>Lewati</Button>
          </View>

          {/* Info Card - Dynamically Positioned */}
          <View style={[styles.tooltipContainer, targetLayout && targetLayout.y > SCREEN_HEIGHT / 2 ? styles.tooltipTop : styles.tooltipBottom]}>
            <Card style={styles.card} mode="elevated">
              <Card.Content>
                <Text variant="titleLarge" style={[styles.cardTitle, { color: theme.colors.primary }]}>
                  {currentStep.title}
                </Text>
                <Text variant="bodyMedium" style={styles.cardDescription}>
                  {currentStep.description}
                </Text>
              </Card.Content>
              <Card.Actions style={styles.actions}>
                <Text style={{ color: theme.colors.outline, marginRight: 'auto', marginLeft: 8 }}>
                  Langkah {currentIndex + 1} dari {steps.length}
                </Text>
                <Button mode="contained" onPress={handleNext}>
                  {currentIndex === steps.length - 1 ? 'Selesai' : 'Lanjut'}
                </Button>
              </Card.Actions>
            </Card>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  progressDotActive: {
    width: 24,
  },
  tooltipContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    padding: 16,
  },
  tooltipTop: {
    top: Platform.OS === 'ios' ? 100 : 80,
  },
  tooltipBottom: {
    bottom: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  card: {
    borderRadius: 24,
    elevation: 8,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    lineHeight: 22,
  },
  actions: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  confettiContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  celebrateTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  celebrateText: {
    color: '#FFF',
    textAlign: 'center',
  }
});
