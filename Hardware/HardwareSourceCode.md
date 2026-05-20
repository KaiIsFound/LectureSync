#include <Arduino.h>
#include <WebSocketsServer.h>
#include <WiFi.h>
#include <driver/i2s.h>

// --- Cấu hình WiFi ---
const char *WIFI_SSID = "esp32";
const char *WIFI_PASSWORD = "88888888";

// --- Cấu hình INMP441 ---
#define I2S_WS_PIN 25
#define I2S_SCK_PIN 14
#define I2S_SD_PIN 32
#define I2S_PORT I2S_NUM_0
#define I2S_SAMPLE_RATE 16000
#define I2S_READ_SIZE 512

WebSocketsServer webSocket = WebSocketsServer(81);
bool clientConnected = false;
// LED báo hiệu (LED màu lam thường là GPIO2 trên nhiều board ESP32)
#define LED_PIN 2
#define LED_ON_LEVEL HIGH
#define SIGNAL_TIMEOUT_MS 300

int lastClient = -1;
unsigned long lastSignalMillis = 0;

int32_t i2s_raw[I2S_READ_SIZE];
int16_t pcm_out[I2S_READ_SIZE];

void i2s_init() {
  i2s_config_t cfg = {.mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
            .sample_rate = I2S_SAMPLE_RATE,
            .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
            .channel_format = I2S_CHANNEL_FMT_ONLY_RIGHT,
            .communication_format = I2S_COMM_FORMAT_STAND_I2S,
            .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
            .dma_buf_count = 8,
            .dma_buf_len = I2S_READ_SIZE,
            .use_apll = false,
            .tx_desc_auto_clear = false,
            .fixed_mclk = 0};
  i2s_pin_config_t pins = {.bck_io_num = I2S_SCK_PIN,
               .ws_io_num = I2S_WS_PIN,
               .data_out_num = I2S_PIN_NO_CHANGE,
               .data_in_num = I2S_SD_PIN};
  i2s_driver_install(I2S_PORT, &cfg, 0, NULL);
  i2s_set_pin(I2S_PORT, &pins);
  i2s_start(I2S_PORT);
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t *payload,
          size_t length) {
  if (type == WStype_CONNECTED) {
    Serial.printf("[WebSocket] Client #%u connected\n", num);
    clientConnected = true;
    lastClient = num;
    digitalWrite(LED_PIN, LED_ON_LEVEL); // bật LED khi có client
  } else if (type == WStype_DISCONNECTED) {
    Serial.printf("[WebSocket] Client #%u disconnected\n", num);
    if (webSocket.connectedClients() == 0) {
      clientConnected = false;
      lastClient = -1;
      digitalWrite(LED_PIN, !LED_ON_LEVEL); // tắt LED khi không còn client
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.printf("\n[Info] Dang ket noi WiFi \"%s\"...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
  delay(500);
  Serial.print(".");
  }
  Serial.printf("\n[OK] WiFi Connected! IP: %s\n",
        WiFi.localIP().toString().c_str());

  i2s_init();

  // Cấu hình LED
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, !LED_ON_LEVEL);

  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("[OK] WebSocket Server dang chay o Port 81");
}

void loop() {
  webSocket.loop();

  // Tắt LED nếu đã quá ngưỡng timeout kể từ tín hiệu cuối
  if (millis() - lastSignalMillis > SIGNAL_TIMEOUT_MS && lastClient == -1) {
    digitalWrite(LED_PIN, !LED_ON_LEVEL);
  }

  if (clientConnected) {
    size_t bytes_read;
    if (i2s_read(I2S_PORT, i2s_raw, sizeof(i2s_raw), &bytes_read, 50) ==
        ESP_OK &&
        bytes_read > 0) {
      int samples_in = bytes_read / 4;
      // Thuật toán tách bit "siêu ngon" của bạn
      for (int i = 0; i < samples_in; i++) {
        int32_t s24 = (i2s_raw[i] >> 8) & 0x00FFFFFF;
        if (s24 & 0x00800000)
          s24 |= 0xFF000000;

        int32_t sample = (int16_t)(s24 >> 8);
        // Tăng độ nhạy lên 5 lần để thu rõ giọng nói từ xa
        sample *= 5;

        // Tránh méo tiếng nếu âm thanh quá to
        if (sample > 32767)
          sample = 32767;
        if (sample < -32768)
          sample = -32768;

        pcm_out[i] = (int16_t)sample;
      }
      // Gửi dữ liệu tới tất cả client đang kết nối (broadcast)
      webSocket.broadcastBIN((uint8_t *)pcm_out, samples_in * 2);

      // Cập nhật trạng thái LED theo tín hiệu âm thanh
      lastSignalMillis = millis();
      digitalWrite(LED_PIN, LED_ON_LEVEL);
    }
  }
}
