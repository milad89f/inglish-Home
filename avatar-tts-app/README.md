# 🎭 Avatar TTS App - Language Learning Assistant

A modern React Native application for language learning that combines AI-powered avatar video generation with speech-to-text technology. Practice pronunciation, get real-time feedback, and improve your language skills with interactive avatar videos.

![Avatar TTS App](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)
![Expo](https://img.shields.io/badge/Expo-~54.0.0-black.svg)
![D-ID API](https://img.shields.io/badge/D--ID-API-gold.svg)
![Deepgram](https://img.shields.io/badge/Deepgram-STT-green.svg)

## ✨ Features

### 🎬 Avatar Video Generation
- 🎭 **AI Avatar Generation** - Create realistic talking avatars that speak your sentences
- 🎤 **Multi-Language Support** - English and Turkish voices with female neural voices
- 💾 **Local Storage** - Save generated videos locally on your device
- 🔄 **Video Playback Controls** - Play, pause, and restart videos with intuitive controls

### 🎯 Language Learning Features
- 🎙️ **Speech-to-Text (STT)** - Record your voice and convert it to text using Deepgram API
- 📊 **Pronunciation Accuracy** - Get real-time percentage score comparing your pronunciation to the reference text
- ❌ **Visual Feedback** - Incorrect words are highlighted with red underlines
- 📈 **Difficulty Levels** - Automatic difficulty labeling (Kolay/Orta/Zor) based on sentence position

### 🎥 Video Management
- 📚 **Saved Sentences** - Manage your saved video sentences with navigation
- 🔀 **Reorder Sentences** - Move sentences up or down in your list
- 🗑️ **Delete Videos** - Remove unwanted videos from local storage
- ⚙️ **Video Types** - Set videos as:
  - **Idle Loop** - Plays automatically when no sentence is active
  - **Success Video** - Plays automatically when you achieve 100% accuracy
  - **Retry Video** - Plays automatically when accuracy is less than 100%

### 🎨 Modern UI/UX
- 🌙 **Dark Theme** - Beautiful dark interface with blue accent colors
- 📱 **Responsive Design** - Optimized for mobile devices
- ⚙️ **Settings Modal** - Organized settings in a clean modal interface
- 🔢 **Progress Tracking** - See current video position and total count

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device
- D-ID API account
- Deepgram API account (for speech-to-text)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd avatar-tts-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Keys**
   
   Edit `src/config/apiKeys.js` and add your API keys:
   ```javascript
   export const DID_API_KEY = 'your_did_api_key_here';
   export const DEEPGRAM_API_KEY = 'your_deepgram_api_key_here';
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   npm start -- --clear  # Clear cache if needed
   ```

5. **Connect your device**
   - Install Expo Go app on your phone
   - Scan the QR code from the terminal
   - The app will load on your device

## 🔑 API Setup

### D-ID API
1. Visit [D-ID](https://www.d-id.com/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to `src/config/apiKeys.js`

### Deepgram API (Speech-to-Text)
1. Visit [Deepgram](https://console.deepgram.com/)
2. Create a free account
3. Generate an API key
4. Add it to `src/config/apiKeys.js`

## 📱 How to Use

### Creating a New Sentence
1. **Select Language** - Choose between English 🇺🇸 and Turkish 🇹🇷
2. **Enter Text** - Type the sentence you want to practice
3. **Generate Avatar** - Tap "Generate Avatar" to create the video
4. **Watch & Learn** - Watch the avatar speak the sentence

### Practicing Pronunciation
1. **Select a Saved Sentence** - Navigate through your saved sentences using Previous/Next buttons
2. **Show Video** - Tap "Show Video" to watch the reference pronunciation
3. **Start Recording** - Tap "Start Recording" and speak the sentence
4. **View Results** - See your accuracy percentage and highlighted incorrect words
5. **Get Feedback** - 
   - If 100% accurate: Success video plays automatically
   - If less than 100%: Retry video plays automatically
   - Both return to idle loop after playing

### Managing Videos
1. **Open Settings** - Tap the "⚙️ Settings" button
2. **Reorder** - Use "Move Up" or "Move Down" to change sentence order
3. **Set Video Types** - Choose to set a video as Idle, Success, or Retry video
4. **Delete** - Remove unwanted videos from the Danger Zone section

## 🎮 Controls & Navigation

### Video Controls
- **▶️ Play/Pause** - Control video playback
- **🔄 Restart** - Restart video from beginning

### Sentence Navigation
- **⬅️ Previous** - Go to previous sentence
- **▶️ Show Video** - Display current sentence video
- **➡️ Next** - Go to next sentence

### Settings (⚙️)
- **⬆️ Move Up** - Move sentence up in the list
- **⬇️ Move Down** - Move sentence down in the list
- **🔄 Set as Idle** - Set video as idle loop
- **⭐ Set as Success Video** - Set video to play on 100% accuracy
- **🔄 Set as Retry Video** - Set video to play on <100% accuracy
- **🗑️ Delete** - Remove video from storage

## 🏗️ Project Structure

```
avatar-tts-app/
├── App.js                      # Main application component
├── app.json                    # Expo configuration
├── package.json               # Dependencies and scripts
├── src/
│   ├── components/
│   │   ├── Avatar.js          # Video player component
│   │   ├── TextInput.js       # Text input component
│   │   └── HighlightedText.js # Component for showing incorrect words
│   ├── config/
│   │   └── apiKeys.js         # API configuration
│   └── services/
│       ├── did.js             # D-ID API service
│       ├── storage.js         # Local storage service (AsyncStorage + FileSystem)
│       ├── stt.js             # Deepgram Speech-to-Text service
│       ├── textSimilarity.js  # Text comparison and accuracy calculation
│       ├── elevenlabs.js      # ElevenLabs API service (legacy)
│       └── network.js         # Network connectivity service
└── assets/                    # App icons and splash screen
```

## 🎯 Available Options

### Languages
- **English** 🇺🇸 - Full support with English female voice (`en-US-JennyNeural`)
- **Turkish** 🇹🇷 - Full support with Turkish female voice (`tr-TR-EmelNeural`)

### Difficulty Levels
- **Kolay Seviye** (Easy) - Green, for sentences at positions 2-3
- **Orta Seviye** (Medium) - Orange, for sentences at positions 4-5
- **Zor Seviye** (Hard) - Red, for sentences at positions 6-7

### Video Types
- **Idle Loop** - Background video that plays continuously
- **Success Video** - Plays automatically when pronunciation is 100% accurate
- **Retry Video** - Plays automatically when pronunciation is less than 100%

## 🔧 Configuration

### Voice Settings
The app uses Microsoft Neural voices through D-ID:
- English: `en-US-JennyNeural`
- Turkish: `tr-TR-EmelNeural`

### Storage
- Uses `AsyncStorage` for metadata
- Uses `expo-file-system` for video file storage
- Videos are stored locally in app document directory

### API Limits
- **D-ID Free Tier**: 20 credits/month
- **Deepgram Free Tier**: Check current limits at [Deepgram Pricing](https://deepgram.com/pricing/)

## 📊 Features Details

### Speech-to-Text
- Uses Deepgram API with word-level confidence scores
- Supports language hints for better accuracy
- Returns word-by-word comparison results

### Accuracy Calculation
- Uses Levenshtein distance algorithm
- Compares normalized text (removes punctuation, case-insensitive)
- Provides percentage score from 0-100%

### Visual Feedback
- Correct words: Displayed normally
- Incorrect words: Underlined in red with bold font

### Automatic Video Transitions
- When sentence ends → Returns to idle loop
- When 100% accuracy achieved → Plays success video → Returns to idle
- When <100% accuracy → Plays retry video → Returns to idle

## 🚨 Troubleshooting

### Common Issues

**"Internet connection appears to be offline"**
- Use tunnel mode: `npm run tunnel`
- Check your internet connection
- Ensure phone and computer are on same network

**"Invalid parameters" error**
- Verify your API keys are correct
- Check if you have sufficient API credits
- Try with shorter text first

**Video not playing**
- Check if video generation completed successfully
- Try tapping the restart button 🔄
- Ensure stable internet connection

**Speech-to-Text not working**
- Verify Deepgram API key is correct
- Check microphone permissions on your device
- Ensure stable internet connection during recording

**"Incompatible React versions" error**
- Clear cache: `npm start -- --clear`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Debug Mode
Enable debug logging by checking the console output in your terminal.

## 🛠️ Development

### Available Scripts

```bash
npm start          # Start development server on port 8081
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
npm run tunnel     # Start with tunnel mode
npm run clear      # Start with cleared cache
```

### Environment Variables

You can use environment variables instead of hardcoding API keys:

```bash
# Create .env file
DID_API_KEY=your_key_here
DEEPGRAM_API_KEY=your_key_here
```

### Dependencies

Key dependencies:
- `expo-av` - Video playback
- `expo-file-system` - Local file storage
- `@react-native-async-storage/async-storage` - Persistent data storage
- `uuid` - Unique ID generation
- `react-native-get-random-values` - UUID polyfill
- `@react-native-community/netinfo` - Network status

## 📈 Performance

- **Video Generation**: 30-60 seconds
- **Video Quality**: High definition
- **Supported Text Length**: Up to 500 characters
- **Local Storage**: Unlimited videos (device storage dependent)
- **STT Processing**: 2-5 seconds

## 🎯 Use Cases

This app is perfect for:
- 📚 Language learning students
- 🗣️ Pronunciation practice
- 🎓 Teachers creating interactive lessons
- 🌍 Multilingual communication training
- 📱 Mobile-first learning experiences

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [D-ID](https://www.d-id.com/) for avatar generation API
- [Deepgram](https://deepgram.com/) for speech-to-text API
- [Expo](https://expo.dev/) for React Native framework
- [Microsoft](https://azure.microsoft.com/) for neural voices

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify your API keys and credits
3. Check the console for error messages
4. Ensure stable internet connection
5. Clear cache and restart the app

## 🎉 Recent Updates

- ✅ Local video storage with AsyncStorage and FileSystem
- ✅ Speech-to-Text integration with Deepgram
- ✅ Pronunciation accuracy scoring
- ✅ Visual feedback for incorrect words
- ✅ Idle/Success/Retry video system
- ✅ Sentence reordering functionality
- ✅ Settings modal for organized controls
- ✅ Difficulty level labeling
- ✅ Automatic video transitions

---

**Made with ❤️ using React Native and AI technology**

**Version 1.0.0** - Language Learning Edition
#   i n g l i s h - H o m e 
 
 