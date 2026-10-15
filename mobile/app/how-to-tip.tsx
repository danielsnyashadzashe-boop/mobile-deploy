import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width } = Dimensions.get('window');
const VIDEO_HEIGHT = width * (9 / 16);

const videoSource = require('../assets/videos/tippa_explainer.mp4');

const STEPS = [
  {
    number: 1,
    color: '#10B981',
    bg: '#ECFDF5',
    icon: 'qr-code-outline' as const,
    title: 'Find the code on the lanyard',
    body: 'Every car guard wears a lanyard with a QR card on it. That code belongs to that guard alone — whatever you tip reaches them and nobody else. If you cannot see a lanyard, simply ask.',
  },
  {
    number: 2,
    color: '#5B94D3',
    bg: '#EFF6FF',
    icon: 'phone-portrait-outline' as const,
    title: 'Scan the code with your phone',
    body: 'iPhone / newer Samsung: open the Camera app and point it at the code — a yellow link appears at the bottom, tap it.\n\nOther Android: swipe down from the top, tap the QR scanner tile, then point it at the code.\n\nOlder phones: install a free QR scanner from the Play Store.',
  },
  {
    number: 3,
    color: '#F59E0B',
    bg: '#FFFBEB',
    icon: 'pencil-outline' as const,
    title: 'Enter the amount, then type Tip',
    body: 'The payment page opens with the guard\'s details already filled in. Type in the amount you would like to give. The reference may not be left empty — simply type Tip. Then tap Proceed.',
  },
  {
    number: 4,
    color: '#8B5CF6',
    bg: '#F5F3FF',
    icon: 'card-outline' as const,
    title: 'Choose how you want to pay',
    body: 'We suggest Scan to Pay — it opens your own banking app. Choose your bank from the list, or Masterpass if your bank is not listed. Instant EFT with Ozow works just as well. Card is secure too. All options reach the same place.',
  },
  {
    number: 5,
    color: '#10B981',
    bg: '#ECFDF5',
    icon: 'checkmark-circle-outline' as const,
    title: 'Confirm, and the tip is theirs',
    body: 'Approve the payment in your banking app, the way you normally do. The tip reflects on the guard\'s phone straight away, so you both know it arrived.',
  },
];

const GOOD_TO_KNOW = [
  { icon: 'phone-portrait-outline' as const, text: 'No mobile number needed' },
  { icon: 'shield-checkmark-outline' as const, text: 'No personal information collected' },
  { icon: 'apps-outline' as const, text: 'No app to download' },
  { icon: 'camera-outline' as const, text: 'Works on any phone with a camera' },
];

export default function HowToTipScreen() {
  const router = useRouter();
  const [videoError, setVideoError] = useState(false);

  const player = useVideoPlayer(videoSource, p => {
    p.loop = false;
    p.muted = false;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How to Tip a Car Guard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Video */}
        <View style={styles.videoContainer}>
          {!videoError ? (
            <VideoView
              player={player}
              style={{ width, height: VIDEO_HEIGHT }}
              contentFit="cover"
              allowsFullscreen
              allowsPictureInPicture
              nativeControls
            />
          ) : (
            <View style={[{ width, height: VIDEO_HEIGHT }, styles.videoFallback]}>
              <Ionicons name="play-circle-outline" size={56} color="#9CA3AF" />
              <Text style={{ color: '#6B7280', marginTop: 8 }}>Video unavailable</Text>
            </View>
          )}
        </View>

        {/* Intro */}
        <View style={styles.intro}>
          <Text style={styles.introText}>
            Quick, safe and completely cashless. There is no app to download. The whole thing takes under a minute.
          </Text>
        </View>

        {/* Steps */}
        <View style={styles.section}>
          {STEPS.map(step => (
            <View key={step.number} style={[styles.stepCard, { backgroundColor: step.bg, borderColor: step.color + '30' }]}>
              <View style={styles.stepLeft}>
                <View style={[styles.stepBadge, { backgroundColor: step.color }]}>
                  <Text style={styles.stepNumber}>{step.number}</Text>
                </View>
                <View style={styles.stepLine} />
              </View>
              <View style={styles.stepContent}>
                <View style={[styles.stepIconWrap, { backgroundColor: step.color + '20' }]}>
                  <Ionicons name={step.icon} size={20} color={step.color} />
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepBody}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Good to Know */}
        <View style={styles.goodToKnow}>
          <Text style={styles.goodTitle}>Good to Know</Text>
          <View style={styles.goodGrid}>
            {GOOD_TO_KNOW.map((item, i) => (
              <View key={i} style={styles.goodItem}>
                <View style={styles.goodIcon}>
                  <Ionicons name={item.icon} size={20} color="#10B981" />
                </View>
                <Text style={styles.goodText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Payments processed securely by Netcash</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  videoContainer: {
    backgroundColor: '#000',
  },
  videoFallback: {
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intro: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  introText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  stepCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 4,
  },
  stepLeft: {
    width: 48,
    alignItems: 'center',
    paddingTop: 16,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  stepContent: {
    flex: 1,
    padding: 16,
    paddingLeft: 8,
  },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  stepBody: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  goodToKnow: {
    margin: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  goodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  goodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '47%',
    gap: 8,
  },
  goodIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goodText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
    paddingHorizontal: 20,
  },
});
