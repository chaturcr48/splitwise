# FairSplit React Native App

A beginner-friendly React Native app for tracking shared expenses and managing money between friends. Built with Expo and React Navigation.

## Features

- 📝 **Add Expenses**: Log shared expenses with a description and amount
- 👥 **Split Costs**: Automatically split expenses among multiple people
- 💰 **Track Balances**: See who owes whom at a glance
- 🧮 **Settlement Calculations**: Get recommended settlements to balance expenses
- 📱 **Mobile First**: Works on both iOS and Android

## Project Structure

```
fairsplit/
├── App.js                 # Main app entry point with navigation setup
├── app.json              # Expo configuration
├── package.json          # Dependencies and scripts
├── babel.config.js       # Babel configuration for Expo
├── screens/              # App screens
│   ├── HomeScreen.js     # Display list of expenses
│   ├── AddExpenseScreen.js # Add new expenses
│   └── SettleUpScreen.js # View balances and settlements
├── components/           # Reusable components (ready for expansion)
├── context/
│   └── ExpenseContext.js # Global state management
└── assets/              # Images, fonts, and icons
```

## Getting Started

### Prerequisites
- Node.js and npm installed
- Expo CLI: `npm install -g expo-cli`
- A mobile device with Expo Go app, or an emulator

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```
   This will start the Expo development server and display a QR code.

3. **Run the app:**
   - **iOS Simulator**: Press `i`
   - **Android Emulator**: Press `a`
   - **Physical Device**: Scan the QR code with Expo Go app

### Available Scripts

- `npm start` - Start the development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run on web browser

## How to Use

### Adding Expenses
1. Tap the "Add" tab
2. Enter the expense description (e.g., "Dinner")
3. Enter the amount
4. Select who paid for the expense
5. Select who should split the expense
6. Tap "Add Expense"

### Viewing Expenses
The "Expenses" tab shows all logged expenses with who paid for them.

### Settling Up
The "Settle" tab shows:
- **Total Balances**: How much each person is owed or owes
- **Settlements Needed**: Specific payments to balance everything out

## Understanding the Code

### ExpenseContext.js
Contains the global state for:
- `expenses`: Array of all expenses
- `people`: List of people in the group
- `addExpense`: Function to add new expenses
- `deleteExpense`: Function to remove expenses
- `calculateBalance`: Function to compute who owes whom

### Navigation Structure
- **Tab Navigator**: Three main tabs (Expenses, Add, Settle)
- **Stack Navigators**: Each tab has its own stack navigator for potential nested screens

### Styling
All screens use React Native's `StyleSheet` for performance. Colors are defined with inline styles for easy customization.

## Customization

### Change Colors
Edit the color values in the screen files:
- Primary color: `#FF6B6B` (red)
- Secondary color: `#4ECDC4` (teal)
- Tertiary color: `#45B7D1` (blue)

### Add More People
Modify the initial state in `ExpenseContext.js`:
```javascript
const [people, setPeople] = useState([
  { id: '1', name: 'You', color: '#FF6B6B' },
  { id: '2', name: 'Friend 1', color: '#4ECDC4' },
  { id: '3', name: 'Friend 2', color: '#45B7D1' },
  // Add more people here
]);
```

### Add New Features
- Create new components in the `components/` folder
- Add new screens in the `screens/` folder
- Add new routes in `App.js`

## Dependencies

- **expo**: Framework for building React Native apps
- **react-navigation**: Navigation library for mobile apps
- **react-native-gesture-handler**: Gesture library for navigation
- **react-native-screens**: Native navigation containers
- **@expo/vector-icons**: Icon library

## Troubleshooting

### App won't start
- Clear the Expo cache: `expo start --clear`
- Delete `node_modules` and reinstall: `npm install`

### QR code not showing
- Restart the development server
- Check your internet connection
- Make sure port 19000 is available

### Module not found errors
- Run `npm install` again
- Delete the `.expo` folder and restart

## Next Steps for Learning

1. **Add persistence**: Use `AsyncStorage` to save expenses
2. **Add user profiles**: Create a settings screen for adding people
3. **Add date filtering**: Filter expenses by date range
4. **Add statistics**: Show spending patterns and statistics
5. **Add images**: Add expense photos/receipts
6. **Backend integration**: Connect to a database for cloud sync

## Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Context API](https://react.dev/reference/react/useContext)

## License

MIT

## Support

For questions or issues, refer to the official React Native and Expo documentation.
