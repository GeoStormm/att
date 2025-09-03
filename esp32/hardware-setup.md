# ESP32 RFID Hardware Setup Guide

## 🛠️ Required Components

- **ESP32 Development Board** (ESP32-WROOM-32)
- **MFRC522 RFID Reader Module**
- **RFID Cards/Tags** (13.56MHz ISO14443A)
- **LEDs**: 1x Green, 1x Red
- **Buzzer** (Active or Passive)
- **Resistors**: 2x 220Ω (for LEDs)
- **Breadboard and Jumper Wires**

## 🔌 Wiring Connections

### MFRC522 RFID Reader to ESP32:
```
MFRC522    ESP32
VCC    →   3.3V
GND    →   GND
SDA    →   GPIO 21
SCK    →   GPIO 18
MOSI   →   GPIO 23
MISO   →   GPIO 19
RST    →   GPIO 22
```

### Status LEDs and Buzzer:
```
Component     ESP32 Pin    Notes
Green LED  →  GPIO 2      (Success indicator)
Red LED    →  GPIO 4      (Error indicator)
Buzzer     →  GPIO 5      (Audio feedback)
```

### LED Wiring:
```
ESP32 GPIO → 220Ω Resistor → LED Anode → LED Cathode → GND
```

## 📋 Assembly Steps

1. **Mount ESP32** on breadboard
2. **Connect MFRC522** using jumper wires as per wiring table
3. **Add LEDs** with current-limiting resistors
4. **Connect buzzer** between GPIO 5 and GND
5. **Double-check connections** before powering on

## ⚡ Power Requirements

- **ESP32**: 3.3V (via USB or external supply)
- **MFRC522**: 3.3V (DO NOT use 5V - will damage module)
- **Total Current**: ~200mA during operation

## 🔧 Arduino IDE Setup

1. **Install ESP32 Board Package**:
   - File → Preferences
   - Add: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools → Board → Boards Manager → Search "ESP32" → Install

2. **Install Required Libraries** (see `libraries.txt`)

3. **Board Configuration**:
   - Board: "ESP32 Dev Module"
   - Upload Speed: 921600
   - CPU Frequency: 240MHz

## 🧪 Testing Steps

1. **Upload code** to ESP32
2. **Open Serial Monitor** (115200 baud)
3. **Check WiFi connection** - should show IP address
4. **Test RFID scanning** - place card near reader
5. **Verify Supabase communication** - check serial output

## 🚨 Troubleshooting

### Common Issues:

**RFID not detected:**
- Check 3.3V power (NOT 5V)
- Verify SPI connections
- Ensure card is 13.56MHz compatible

**WiFi connection fails:**
- Check SSID/password in code
- Verify 2.4GHz network (ESP32 doesn't support 5GHz)

**Supabase errors:**
- Verify API key and URL
- Check internet connection
- Ensure database schema is deployed

**Upload fails:**
- Press and hold BOOT button during upload
- Check USB cable and drivers
- Try different upload speed (115200)
