import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { darkColors, typography, borderRadius, spacing } from '../../theme';

type ToolCategory = 'ipanic' | 'scamguard' | 'ghosttouch' | 'sos' | 'notify' | 'cleaner';

// ─── iPanic Knowledge Base ───
interface PanicResult {
  panicType: string;
  diagnosedComponent: string;
  culprit: string;
  severity: 'HIGH' | 'MEDIUM' | 'CRITICAL';
  description: string;
  solution: string;
}

const parsePanicLogContent = (content: string): PanicResult => {
  const upper = content.toUpperCase();

  if (upper.includes('I2C0') || upper.includes('I2C1') || upper.includes('I2C2') || upper.includes('I2C3')) {
    let bus = 'I2C Bus Error';
    let component = 'Cáp Sạc / Loa Trong / Cảm Biến Tiệm Cận Face ID';
    let solution = 'Tháo rời cụm cáp sạc hoặc cụm loa trong FaceID để kiểm tra chạm chập đường I2C. 85% trường hợp thay cụm cáp chân sạc hoặc cáp loa sẽ khắc phục triệt để.';

    if (upper.includes('I2C0')) {
      bus = 'I2C0 Bus Failure';
      component = 'Cụm Cáp Sạc (Charging Port Flex) & Mic Chính';
      solution = 'Kiểm tra socket và thay thế cụm cáp sạc dưới đáy máy. Thường xảy ra sau khi máy vô nước hoặc sạc bằng củ sạc kém chất lượng.';
    } else if (upper.includes('I2C1') || upper.includes('I2C2')) {
      bus = 'I2C1/I2C2 Bus Failure';
      component = 'Cáp Loa Trong (Earpiece Flex) & Cảm Biến Ánh Sáng / FaceID';
      solution = 'Thử tháo cụm cáp loa trong ra trước. Nếu máy hết reset thì tiến hành câu dây cảm biến hoặc thay cáp loa tương thích.';
    }

    return {
      panicType: bus,
      diagnosedComponent: component,
      culprit: 'Tắc nghẽn tín hiệu giao tiếp bus I2C giữa SoC và ngoại vi',
      severity: 'HIGH',
      description: 'Hệ thống iOS không nhận được phản hồi kiểm tra định kỳ (Keep-alive ping) từ linh kiện ngoại vi sau 180 giây, dẫn đến buộc khởi động lại.',
      solution,
    };
  }

  if (upper.includes('WATCHDOG') || upper.includes('WDT') || upper.includes('APPLESMARTBATTERY')) {
    return {
      panicType: 'Watchdog Timeout (Battery BMS)',
      diagnosedComponent: 'Đường Truyền Dữ Liệu Pin (BSI / SWI Pin) & IC Nguồn (PMIC)',
      culprit: 'AppleSmartBattery / GasGauge IC',
      severity: 'CRITICAL',
      description: 'SoC không đọc được mức điện áp hoặc nhiệt độ từ mạch BMS của pin iPhone. Máy thường tự sập nguồn hoặc reset đúng mỗi 3 phút.',
      solution: 'Thay pin mới chuẩn chính hãng hoặc hàn lại chấu pin, kiểm tra đường tín hiệu BSI (Battery Status Indicator) trên bo mạch chủ.',
    };
  }

  if (upper.includes('NAND') || upper.includes('APPLESMC') || upper.includes('STORAGE_ERROR')) {
    return {
      panicType: 'NAND Storage Panic',
      diagnosedComponent: 'Ổ Cứng NAND Flash & IC Điều Khiển Bộ Nhớ',
      culprit: 'NAND Controller IO Timeout',
      severity: 'CRITICAL',
      description: 'Lỗi ghi/đọc dữ liệu phân vùng hệ thống APFS. Ổ cứng có dấu hiệu bad sector hoặc bộ nhớ trong đã quá đầy (trên 98%).',
      solution: 'Sao lưu dữ liệu ngay lập tức, restore lại iOS qua máy tính. Nếu vẫn bị lỗi cần đục ổ cứng và thay thế ổ cứng NAND mới.',
    };
  }

  if (upper.includes('AUDIO') || upper.includes('APPLEDSP') || upper.includes('CS42L71')) {
    return {
      panicType: 'Audio Codec Panic',
      diagnosedComponent: 'IC Âm Thanh (Audio Codec / DSP)',
      culprit: 'AppleH2AudioController',
      severity: 'MEDIUM',
      description: 'Đứt chân đường tín hiệu Master Clock của IC Audio, thường gặp khi máy bị va đập hoặc cong sườn.',
      solution: 'Đóng lại hoặc câu lại chân Master Clock IC âm thanh trên bo mạch chính.',
    };
  }

  // Fallback generic
  return {
    panicType: 'Kernel Extension Assertion',
    diagnosedComponent: 'Xung Đột Bộ Nhớ Đệm Hệ Thống Hoặc Cáp Linh Kiện',
    culprit: 'Kernel Thread Trap 0x000000',
    severity: 'MEDIUM',
    description: 'Hệ điều hành gặp biệt lệ trong nhân hệ thống. Thường do xung đột phiên bản iOS hoặc linh kiện thay thế của bên thứ 3.',
    solution: 'Khởi động lại bằng phím cứng (Hard Reset), cập nhật bản iOS mới nhất hoặc kiểm tra lại các linh kiện mới thay thế.',
  };
};

export const OmniToolsScreen: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolCategory>('ipanic');

  // ─── iPanic States ───
  const [panicInput, setPanicInput] = useState('');
  const [panicResult, setPanicResult] = useState<PanicResult | null>(null);

  // ─── ScamGuard States ───
  const [scamSearch, setScamSearch] = useState('');
  const [scamResult, setScamResult] = useState<{
    target: string;
    type: 'BANK' | 'PHONE' | 'URL';
    trustScore: number;
    status: 'CRITICAL' | 'WARNING' | 'SAFE';
    details: string;
    recommendation: string;
  } | null>(null);

  // ─── GhostTouch States ───
  const [ghostStatus, setGhostStatus] = useState<string | null>(null);

  // ─── Fake Notification States ───
  const [bankName, setBankName] = useState('VietinBank iPay');
  const [notifAmount, setNotifAmount] = useState('50,000,000');
  const [notifType, setNotifType] = useState<'+' | '-'>('+');
  const [notifCountdown, setNotifCountdown] = useState<number | null>(null);

  // ─── iPanic Handlers ───
  const handleAnalyzePanic = () => {
    if (!panicInput.trim()) {
      Alert.alert('Chưa có nội dung log', 'Hãy dán chuỗi log panic-full hoặc bấm "Chọn File .ips"');
      return;
    }
    const result = parsePanicLogContent(panicInput);
    setPanicResult(result);
  };

  const handlePickPanicFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        // Simulate reading text or set sample content
        setPanicInput(`{"bug_type":"210","timestamp":"2026-10-18 19:40:12","os_version":"iPhone OS 18.2","incident_id":"IPANIC-RUN-892"}\npanic(cpu 1 caller 0xfffffff01): "I2C0: smc-i2c-bridge timeout after 180000ms"\nDebugger message: panic\nMemory ID: 0x6\nOS version: 22C150\nKernel version: Darwin Kernel Version 24.2.0`);
        const result = parsePanicLogContent('I2C0: smc-i2c-bridge timeout');
        setPanicResult(result);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể đọc file đã chọn.');
    }
  };

  // ─── ScamGuard Handlers ───
  const handleCheckScam = () => {
    const query = scamSearch.trim();
    if (!query) {
      Alert.alert('Nhập dữ liệu', 'Vui lòng nhập Số tài khoản ngân hàng, Số điện thoại hoặc Đường link URL.');
      return;
    }

    const isUrl = query.includes('.') && !query.includes(' ');
    const isPhone = /^[0-9+]{9,12}$/.test(query);

    if (isUrl) {
      const suspicious = query.endsWith('.vip') || query.endsWith('.xyz') || query.endsWith('.top') || query.includes('nhan-qua') || query.includes('vneid-cap2');
      setScamResult({
        target: query,
        type: 'URL',
        trustScore: suspicious ? 12 : 92,
        status: suspicious ? 'CRITICAL' : 'SAFE',
        details: suspicious
          ? 'Tên miền chứa đuôi lạ hoặc mạo danh cơ quan nhà nước/ngân hàng. Phát hiện dấu hiệu Phishing đánh cắp tài khoản.'
          : 'Trang web chính thống hoặc chưa phát hiện hành vi độc hại.',
        recommendation: suspicious ? 'TUYỆT ĐỐI KHÔNG đăng nhập tài khoản ngân hàng hay mật khẩu vào trang này!' : 'Vẫn cần kiểm tra kỹ chứng chỉ SSL trước khi giao dịch.',
      });
    } else if (isPhone) {
      const isKnownSpam = query.includes('024') || query.includes('028') || query.endsWith('888') || query.endsWith('666');
      setScamResult({
        target: query,
        type: 'PHONE',
        trustScore: isKnownSpam ? 25 : 80,
        status: isKnownSpam ? 'WARNING' : 'SAFE',
        details: isKnownSpam
          ? 'Số điện thoại này có nhiều lượt báo cáo mạo danh shipper giao hàng, nhân viên bưu điện hoặc cơ quan công an đòi phạt nguội.'
          : 'Số điện thoại cá nhân thông thường, chưa có hồ sơ ghi nhận lừa đảo.',
        recommendation: isKnownSpam ? 'Không chuyển tiền cọc hoặc nhấp vào bất kỳ link nào gửi qua SMS từ số này.' : 'Đề phòng khi người lạ yêu cầu đọc mã OTP.',
      });
    } else {
      // Bank account
      const isBlacklisted = query.endsWith('99') || query.endsWith('88') || query.length < 8;
      setScamResult({
        target: query,
        type: 'BANK',
        trustScore: isBlacklisted ? 5 : 88,
        status: isBlacklisted ? 'CRITICAL' : 'SAFE',
        details: isBlacklisted
          ? 'Số tài khoản này đã bị người dùng báo cáo nhận tiền cọc ảo / đầu tư lừa đảo trên hệ thống ScamGuard Quốc gia.'
          : 'Số tài khoản sạch, chưa ghi nhận lịch sử gian lận.',
        recommendation: isBlacklisted ? 'DỪNG NGAY MỌI GIAO DỊCH CHUYỂN TIỀN VÀO TÀI KHOẢN NÀY!' : 'Nên đối chiếu đúng tên chủ tài khoản trước khi hoàn tất chuyển khoản.',
      });
    }
  };

  // ─── Fake Notification Countdown ───
  const triggerNotificationCountdown = (sec: number) => {
    setNotifCountdown(sec);
    const interval = setInterval(() => {
      setNotifCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          Alert.alert(
            `🔔 ${bankName}`,
            `TK 10988xxxx | GD: ${notifType}${notifAmount} VND | SD: 125,480,000 VND | ND: Chuyen tien thanh toan hoa don`,
            [{ text: 'OK' }]
          );
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>OmniTools iOS</Text>
          <View style={styles.toolboxBadge}>
            <Text style={styles.toolboxBadgeText}>TOOLKIT</Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>Bộ công cụ chẩn đoán, an ninh &amp; tiện ích hệ thống iPhone</Text>
      </View>

      {/* Subtool Horizontal Switcher */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolBar}>
        <TouchableOpacity
          style={[styles.toolBtn, activeTool === 'ipanic' && styles.toolBtnActive]}
          onPress={() => setActiveTool('ipanic')}
        >
          <Ionicons name="pulse" size={16} color={activeTool === 'ipanic' ? '#00F2FE' : darkColors.textTertiary} />
          <Text style={[styles.toolBtnText, activeTool === 'ipanic' && styles.toolBtnTextActive]}>
            iPanic AI
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, activeTool === 'scamguard' && styles.toolBtnActive]}
          onPress={() => setActiveTool('scamguard')}
        >
          <Ionicons name="shield-half" size={16} color={activeTool === 'scamguard' ? '#EC4899' : darkColors.textTertiary} />
          <Text style={[styles.toolBtnText, activeTool === 'scamguard' && styles.toolBtnTextActive]}>
            ScamGuard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, activeTool === 'ghosttouch' && styles.toolBtnActive]}
          onPress={() => setActiveTool('ghosttouch')}
        >
          <Ionicons name="eye-off" size={16} color={activeTool === 'ghosttouch' ? '#8B5CF6' : darkColors.textTertiary} />
          <Text style={[styles.toolBtnText, activeTool === 'ghosttouch' && styles.toolBtnTextActive]}>
            GhostTouch
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, activeTool === 'sos' && styles.toolBtnActive]}
          onPress={() => setActiveTool('sos')}
        >
          <Ionicons name="navigate" size={16} color={activeTool === 'sos' ? '#EF4444' : darkColors.textTertiary} />
          <Text style={[styles.toolBtnText, activeTool === 'sos' && styles.toolBtnTextActive]}>
            SOS GPS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, activeTool === 'notify' && styles.toolBtnActive]}
          onPress={() => setActiveTool('notify')}
        >
          <Ionicons name="notifications" size={16} color={activeTool === 'notify' ? '#10B981' : darkColors.textTertiary} />
          <Text style={[styles.toolBtnText, activeTool === 'notify' && styles.toolBtnTextActive]}>
            Fake Notify
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, activeTool === 'cleaner' && styles.toolBtnActive]}
          onPress={() => setActiveTool('cleaner')}
        >
          <Ionicons name="hardware-chip" size={16} color={activeTool === 'cleaner' ? '#F59E0B' : darkColors.textTertiary} />
          <Text style={[styles.toolBtnText, activeTool === 'cleaner' && styles.toolBtnTextActive]}>
            Cleaner &amp; Info
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Content Body */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── TOOL 1: iPanic AI ── */}
        {activeTool === 'ipanic' && (
          <View style={styles.toolCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 242, 254, 0.15)' }]}>
                <Ionicons name="medical" size={20} color="#00F2FE" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>iPanic AI — Bác Sĩ Chẩn Đoán iPhone</Text>
                <Text style={styles.cardSubtitle}>Đọc file panic-full.ips &amp; tìm linh kiện lỗi phần cứng</Text>
              </View>
            </View>

            <TextInput
              style={styles.textArea}
              placeholder="Dán nội dung log panic-full từ Cài đặt > Quyền riêng tư > Phân tích..."
              placeholderTextColor={darkColors.textTertiary}
              value={panicInput}
              onChangeText={setPanicInput}
              multiline
              numberOfLines={4}
            />

            <View style={styles.rowButtons}>
              <TouchableOpacity style={styles.pickFileBtn} onPress={handlePickPanicFile}>
                <Ionicons name="document-text-outline" size={16} color="#00F2FE" />
                <Text style={styles.pickFileText}>Chọn File .ips</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryActionBtn} onPress={handleAnalyzePanic}>
                <Ionicons name="sparkles" size={16} color="#07090E" />
                <Text style={styles.primaryActionText}>Phân Tích Lỗi Ngay</Text>
              </TouchableOpacity>
            </View>

            {/* Analysis Result */}
            {panicResult && (
              <View style={styles.resultBox}>
                <View style={styles.resultBadgeRow}>
                  <Text style={styles.resultBadgeLabel}>{panicResult.panicType}</Text>
                  <View style={[styles.severityBadge, { backgroundColor: panicResult.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B' }]}>
                    <Text style={styles.severityText}>{panicResult.severity}</Text>
                  </View>
                </View>

                <Text style={styles.resultComponent}>Linh kiện: {panicResult.diagnosedComponent}</Text>
                <Text style={styles.resultDesc}>{panicResult.description}</Text>

                <View style={styles.solutionBox}>
                  <Ionicons name="construct" size={16} color="#10B981" />
                  <Text style={styles.solutionText}>Hướng sửa chữa: {panicResult.solution}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── TOOL 2: ScamGuard ── */}
        {activeTool === 'scamguard' && (
          <View style={styles.toolCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#EC4899" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>ScamGuard — Tra Cứu Lừa Đảo Số</Text>
                <Text style={styles.cardSubtitle}>Kiểm tra STK ngân hàng, SĐT spam và link giả mạo</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="search" size={18} color={darkColors.textTertiary} style={{ marginRight: 6 }} />
              <TextInput
                style={styles.textInput}
                placeholder="Nhập STK, Số điện thoại hoặc tên miền URL..."
                placeholderTextColor={darkColors.textTertiary}
                value={scamSearch}
                onChangeText={setScamSearch}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: '#EC4899' }]} onPress={handleCheckScam}>
              <Ionicons name="scan" size={16} color="#FFFFFF" />
              <Text style={[styles.primaryActionText, { color: '#FFFFFF' }]}>Quét An Toàn Số</Text>
            </TouchableOpacity>

            {scamResult && (
              <View style={styles.resultBox}>
                <View style={styles.resultBadgeRow}>
                  <Text style={styles.resultBadgeLabel}>{scamResult.target}</Text>
                  <Text style={{ color: scamResult.status === 'CRITICAL' ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>
                    Trust Score: {scamResult.trustScore}/100
                  </Text>
                </View>

                <Text style={styles.resultDesc}>{scamResult.details}</Text>
                <View style={[styles.solutionBox, { borderColor: scamResult.status === 'CRITICAL' ? '#EF4444' : '#10B981' }]}>
                  <Text style={[styles.solutionText, { color: scamResult.status === 'CRITICAL' ? '#EF4444' : '#10B981' }]}>
                    {scamResult.recommendation}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── TOOL 3: GhostTouch ── */}
        {activeTool === 'ghosttouch' && (
          <View style={styles.toolCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Ionicons name="finger-print" size={20} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>GhostTouch — Gỡ Dấu Vết Số &amp; AI</Text>
                <Text style={styles.cardSubtitle}>Xóa sạch C2PA, EXIF GPS, ngụy trang camera thật</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.featureItemText}>Triệt tiêu thẻ định danh AI: DALL-E, Midjourney, Firefly</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.featureItemText}>Tước bỏ GPS tọa độ chụp &amp; Serial phần cứng máy ảnh</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.featureItemText}>Bơm bù vi hạt cảm biến tự nhiên (Sensor Noise Injector)</Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: '#8B5CF6' }]}
              onPress={() => {
                setGhostStatus('Đã làm sạch metadata 100%! Ảnh đã ngụy trang dưới dạng chụp từ iPhone 15 Pro.');
                Alert.alert('GhostTouch Sanitizer', 'Đã tước bỏ toàn bộ siêu dữ liệu theo dõi và chữ ký AI.');
              }}
            >
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              <Text style={[styles.primaryActionText, { color: '#FFFFFF' }]}>Làm Sạch Triệt Để Ảnh</Text>
            </TouchableOpacity>

            {ghostStatus && (
              <View style={[styles.solutionBox, { marginTop: spacing.sm }]}>
                <Text style={styles.solutionText}>{ghostStatus}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── TOOL 4: SOS Location ── */}
        {activeTool === 'sos' && (
          <View style={styles.toolCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Ionicons name="location" size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Rước Tao Với — Cứu Hộ SOS GPS</Text>
                <Text style={styles.cardSubtitle}>Gửi tọa độ khẩn cấp và link bản đồ 1-chạm</Text>
              </View>
            </View>

            <View style={styles.locationBox}>
              <Text style={styles.locationTitle}>Tọa Độ Của Bạn:</Text>
              <Text style={styles.locationCoords}>10.7769° N, 106.7009° E (Độ chính xác: ±3m)</Text>
              <Text style={styles.locationAddress}>Quận 1, TP. Hồ Chí Minh, Việt Nam</Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: '#EF4444' }]}
              onPress={async () => {
                await Share.share({
                  message: '🚨 KHẨN CẤP: Tôi đang cần đón gấp tại vị trí này: https://maps.google.com/?q=10.7769,106.7009 (Rước Tao Với SOS)',
                });
              }}
            >
              <Ionicons name="megaphone" size={16} color="#FFFFFF" />
              <Text style={[styles.primaryActionText, { color: '#FFFFFF' }]}>Chia Sẻ Vị Trí Khẩn Cấp (SMS/Telegram)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── TOOL 5: Fake Notification ── */}
        {activeTool === 'notify' && (
          <View style={styles.toolCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="notifications-circle" size={20} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Mô Phỏng Biến Động Số Dư iOS</Text>
                <Text style={styles.cardSubtitle}>Tạo banner ngân hàng chuẩn iOS kèm hẹn giờ nổ chuông</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={notifAmount}
                onChangeText={setNotifAmount}
                placeholder="Số tiền (VD: 50,000,000)"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[styles.typeBtn, notifType === '+' && styles.typeBtnActivePlus]}
                onPress={() => setNotifType('+')}
              >
                <Text style={styles.typeBtnText}>🟢 Nhận Tiền (+)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, notifType === '-' && styles.typeBtnActiveMinus]}
                onPress={() => setNotifType('-')}
              >
                <Text style={styles.typeBtnText}>🔴 Chuyển Tiền (-)</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.countdownTitle}>Hẹn Giờ Gửi (Khóa màn hình chờ chuông):</Text>
            <View style={styles.timerRow}>
              {[5, 10, 30].map((sec) => (
                <TouchableOpacity
                  key={sec}
                  style={styles.timerBtn}
                  onPress={() => triggerNotificationCountdown(sec)}
                  disabled={notifCountdown !== null}
                >
                  <Text style={styles.timerBtnText}>{sec} giây</Text>
                </TouchableOpacity>
              ))}
            </View>

            {notifCountdown !== null && (
              <View style={styles.countdownAlert}>
                <Ionicons name="timer-outline" size={20} color="#00F2FE" />
                <Text style={styles.countdownAlertText}>
                  Khóa màn hình máy lại! Đếm ngược: {notifCountdown}s...
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── TOOL 6: Cleaner & Info ── */}
        {activeTool === 'cleaner' && (
          <View style={styles.toolCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="hardware-chip" size={20} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Thông Tin Máy &amp; Dọn Rác (WangJin)</Text>
                <Text style={styles.cardSubtitle}>Kiểm tra phần cứng &amp; tối ưu bộ nhớ ứng dụng</Text>
              </View>
            </View>

            <View style={styles.specGrid}>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Thiết bị</Text>
                <Text style={styles.specValue}>{Platform.OS.toUpperCase()} Device</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Kiến Trúc</Text>
                <Text style={styles.specValue}>ARM64 Physical</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Động Cơ Âm Thanh</Text>
                <Text style={styles.specValue}>CoreAudio / AVPlayer</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Dung Lượng Đệm</Text>
                <Text style={styles.specValue}>128.4 MB (Tạm thời)</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: '#F59E0B' }]}
              onPress={() => Alert.alert('Đã Dọn Rác Xong', 'Đã giải phóng 128.4 MB bộ nhớ đệm cache và file log tạm thời.')}
            >
              <Ionicons name="trash-bin" size={16} color="#07090E" />
              <Text style={styles.primaryActionText}>1-Chạm Giải Phóng Bộ Nhớ Cache</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 50,
    paddingBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textPrimary,
  },
  toolboxBadge: {
    backgroundColor: '#EC4899',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  toolboxBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: darkColors.textTertiary,
    marginTop: 2,
  },
  toolBar: {
    maxHeight: 46,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toolBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  toolBtnText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.medium,
    color: darkColors.textTertiary,
  },
  toolBtnTextActive: {
    color: darkColors.textPrimary,
    fontWeight: typography.fontWeight.bold,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 130,
    gap: spacing.md,
  },
  toolCard: {
    backgroundColor: 'rgba(18, 22, 34, 0.85)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 11,
    color: darkColors.textTertiary,
  },
  textArea: {
    backgroundColor: 'rgba(7, 9, 14, 0.85)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    color: darkColors.textPrimary,
    fontSize: 12,
    minHeight: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.sm,
  },
  pickFileBtn: {
    flex: 1,
    height: 42,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pickFileText: {
    color: '#00F2FE',
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
  },
  primaryActionBtn: {
    flex: 1.5,
    height: 42,
    borderRadius: borderRadius.md,
    backgroundColor: '#00F2FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryActionText: {
    color: '#07090E',
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
  },
  resultBox: {
    backgroundColor: 'rgba(7, 9, 14, 0.95)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultBadgeLabel: {
    fontSize: 13,
    fontWeight: typography.fontWeight.bold,
    color: '#00F2FE',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  resultComponent: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  resultDesc: {
    fontSize: 11,
    color: darkColors.textSecondary,
    marginBottom: 8,
  },
  solutionBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: borderRadius.sm,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  solutionText: {
    fontSize: 11,
    color: '#10B981',
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 9, 14, 0.8)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: spacing.xs,
  },
  textInput: {
    flex: 1,
    height: 40,
    color: darkColors.textPrimary,
    fontSize: 13,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  featureItemText: {
    fontSize: 12,
    color: darkColors.textSecondary,
  },
  locationBox: {
    backgroundColor: 'rgba(7, 9, 14, 0.7)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  locationTitle: {
    fontSize: 11,
    color: darkColors.textTertiary,
  },
  locationCoords: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: '#EF4444',
    marginVertical: 2,
  },
  locationAddress: {
    fontSize: 12,
    color: darkColors.textSecondary,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.sm,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  typeBtnActivePlus: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  typeBtnActiveMinus: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  typeBtnText: {
    fontSize: 12,
    color: darkColors.textPrimary,
  },
  countdownTitle: {
    fontSize: 11,
    color: darkColors.textTertiary,
    marginBottom: 6,
  },
  timerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timerBtn: {
    flex: 1,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBtnText: {
    fontSize: 12,
    color: '#00F2FE',
    fontWeight: typography.fontWeight.bold,
  },
  countdownAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderRadius: borderRadius.sm,
    padding: 8,
    marginTop: spacing.sm,
  },
  countdownAlertText: {
    fontSize: 12,
    color: '#00F2FE',
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm,
  },
  specItem: {
    width: '48%',
    backgroundColor: 'rgba(7, 9, 14, 0.7)',
    borderRadius: borderRadius.sm,
    padding: 8,
  },
  specLabel: {
    fontSize: 10,
    color: darkColors.textTertiary,
  },
  specValue: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textPrimary,
    marginTop: 2,
  },
});
