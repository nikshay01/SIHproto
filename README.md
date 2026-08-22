# E-Cycle India - AI-Powered E-Waste Identification & National Facility Directory Platform

## Overview

E-Cycle India is a comprehensive platform designed to combat electronic waste fraud and promote responsible recycling through AI-powered device verification and a nationwide directory of authorized e-waste facilities. The platform combines computer vision technology with geospatial data to help users identify e-waste items, locate certified recycling facilities, and earn rewards for responsible disposal.

## Table of Contents
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [How to Use Each Component](#how-to-use-each-component)
- [Features](#features)
- [Data Sources](#data-sources)
- [Development & Testing](#development--testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- API keys for AI services (NVIDIA API or OpenAI API)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd E-Cycle-India
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with:
```
NVIDIA_API_KEY=your_nvidia_api_key_here
# or
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000
```

4. Start the development server:
```bash
npm start
# or
node server.js
```

5. Open your browser and navigate to:
```
http://localhost:5000
```

## Project Structure

```
E-Cycle-India/
├── index.html                 # Main HTML entry point
├── style.css                  # Main stylesheet
├── app.js                     # Client-side application logic
├── server.js                  # Express backend server
├── package.json               # Node.js dependencies and scripts
├── package-lock.json          # Dependency lock file
├── .env                       # Environment variables (API keys, port)
├── FEATURES.md                # Comprehensive feature catalog
├── README.md                  # This file
│
├── services/                  # Backend service modules
│   ├── deviceService.js       # Device catalog and metadata services
│   ├── creditEngine.js        # E-waste credit calculation logic
│   ├── aiVerificationService.js # AI-powered device verification
│   └── verificationStore.js   # Transaction and wallet management
│
├── data/                      # Data storage
│   ├── e-waste-facilities/    # Facility data by state/UT
│   │   ├── all_facilities.json      # Standard facility dataset
│   │   ├── all_facilities_fixed.json # Fixed facility IDs dataset
│   │   └── states/                # Individual state facility files
│   ├── audit_logs.json        # System audit logs
│   ├── device_composition.json # Device material composition data
│   ├── user_wallets.json      # User credit wallet data
│   └── verification_transactions.json # Transaction history
│
├── validation/                # Testing and validation scripts
│   ├── validate_coordinates.py # Facility coordinate validation
│   ├── fix_ids.py             # Facility ID fixing utility
│   ├── test_facilities.json   # Test facility datasets
│   ├── test_results.json      # Validation test results
│   └── ...                    # Other test files
│
├── image-testing/             # Image-specific testing
│   └── .env                   # Environment for image testing
│
├── map-testing/               # Map and geolocation testing
│   ├── extract_addresses.py   # Address extraction utility
│   ├── google_maps_validator.py # Google Maps validation
│   ├── google_maps_validation_results.json # Validation results
│   └── coordinate_sources.json # Coordinate source data
│
├─objectRrecognition/          # Object recognition testing
│   └── .env                   # Environment for object recognition
│
├── stitch-designs/            # Design system assets
└── node_modules/              # Node.js dependencies
```

## How to Use Each Component

### 1. Frontend Interface (`index.html`)
The main user interface accessible via web browser. Features include:
- **Navigation Bar**: Access different sections (Home, Locate, Verify Device, Facility Portal, Wallet, Evaluate, Learn)
- **Device Verification Section**: Upload or capture images for AI-powered e-waste identification
- **Facility Directory**: Interactive map and list view of 421+ authorized e-waste facilities
- **Wallet Section**: View earned credits and transaction history
- **Theme Toggle**: Switch between light and dark themes
- **Near Me Button**: Auto-locate user and sort facilities by proximity
- **Dataset Selector**: Toggle between standard and fixed facility datasets
- **Export Data**: Download current facility data as JSON

### 2. Client-Side Logic (`app.js`)
Handles all frontend interactions and state management:
- **Application State**: Manages facility data, user location, map state, and UI interactions
- **Navigation Logic**: Handles section switching and active states
- **Map Integration**: Leaflet map setup with marker clustering and custom markers
- **Geolocation**: User location detection and reverse geocoding via OpenStreetMap Nominatim
- **Facility Filtering**: Search, sort, and filter capabilities
- **Bookmark Management**: Save/favorite facilities using localStorage
- **AI Verification Integration**: Communicates with backend for device analysis
- **Wallet Operations**: Credit balance updates and transaction handling
- **Certificate Generation**: EPR certificate creation and printing
- **Pickup Scheduling**: Doorstep collection booking interface

### 3. Styles (`style.css`)
Complete styling system featuring:
- **Stitch "Zen Trash" Design Language**: Minimalist aesthetic inspired by Linear, Vercel, and Apple
- **Dark/Light Theme Support**: Obsidian dark mode (default) and Clean Paper light mode
- **Responsive Design**: Adaptive layouts for desktop, tablet, and mobile
- **Glassmorphism Effects**: Frosted glass cards with backdrop blur
- **Modern Typography**: Manrope (headlines), Inter (body), JetBrains Mono (codes/IDs)
- **Interactive States**: Hover, focus, and active states for all UI elements
- **Accessibility**: Proper color contrast and semantic HTML support

### 4. Backend Server (`server.js`)
Express.js API server providing:
- **Health Check Endpoint** (`GET /api/health`): Server status and API key detection
- **AI Verification Endpoint** (`POST /api/analyze`): Image analysis via NVIDIA/OpenAI vision models
- **Device Catalog Services**: Device brand/model lookup and metadata
- **Credit Calculation**: Material-based credit scoring and environmental impact metrics
- **Transaction Management**: Verification transactions, wallet operations, and audit logs
- **CORS Support**: Cross-origin requests enabled for local development
- **File Serving**: Static file serving for frontend assets
- **Payload Handling**: 16MB limit for image uploads

### 5. Service Modules (`services/`)

#### deviceService.js
- Device catalog management (brands, models, categories)
- Device lookup by ID, brand/model search
- Metadata retrieval for device composition

#### creditEngine.js
- Credit configuration constants
- Device credit calculation based on category/brand/model
- Material-based credit calculation from device composition
- Environmental impact metrics (carbon offset, toxic waste diversion)

#### aiVerificationService.js
- Image preprocessing for AI analysis
- Communication with NVIDIA/OpenAI vision APIs
- JSON response parsing and normalization
- Error handling and fallback mechanisms

#### verificationStore.js
- User wallet creation and management
- Credit balance queries and updates
- Transaction logging and retrieval
- Verification transaction status management
- Facility-level transaction verification/rejection
- Audit log generation and retrieval

### 6. Data Directory (`data/`)

#### e-waste-facilities/
Contains comprehensive facility data:
- **all_facilities.json**: Master dataset of 421+ authorized facilities across 36 States/UTs
- **all_facilities_fixed.json**: Version with corrected facility IDs
- **states/**: Individual JSON files for each state/UT containing facility data

Each facility record includes:
- Facility ID, name, type (Recycler/Dismantler/Refurbisher/Collection Center)
- Address, district, state, PIN code
- GPS coordinates (latitude, longitude)
- Processing capacity (MTA - Metric Tonnes per Annum)
- Authorization details (SPCB/CPCB registration)
- Contact information (phone, email, website, helpline)
- Operational hours and specializations

#### Other Data Files:
- **device_composition.json**: Material breakdown of various electronic devices
- **user_wallets.json**: User credit balances and wallet information
- **verification_transactions.json**: History of all verification transactions
- **audit_logs.json**: System activity logs for monitoring and debugging

### 7. Validation & Testing (`validation/`)
Tools for ensuring data quality and system reliability:
- **validate_coordinates.py**: Validates GPS coordinates of all facilities
- **fix_ids.py**: Corrects duplicate or missing facility IDs
- **test_*.json**: Various test datasets for development and testing
- **test_results.json**: Results from validation runs
- **subset_*.json**: Reduced datasets for faster testing
- **quick10.json**: Small sample set for rapid testing

### 8. Specialized Testing Directories

#### image-testing/
Tools for testing AI image verification capabilities:
- Environment configuration for image processing tests

#### map-testing/
Geolocation and mapping validation tools:
- **extract_addresses.py**: Extracts addresses from facility data
- **google_maps_validator.py**: Validates facility locations using Google Maps API
- **coordinate_sources.json**: Reference coordinate data sources
- **google_maps_validation_results.json**: Validation results

#### objectRrecognition/
Object recognition testing environment:
- Configuration for object detection model testing

### 9. Design Assets (`stitch-designs/`)
Design system components and assets:
- UI component specifications
- Design tokens and style guides
- Asset exports for consistent implementation

### 10. Configuration Files
- **package.json**: Project dependencies, scripts, and metadata
- **.env**: Environment variables (API keys, ports)
- **.gitignore**: Files and directories to exclude from version control

## Features

### Core Functionality
1. **AI-Powered Device Verification**
   - Live camera viewfinder with image capture
   - Drag-and-drop image upload
   - AI analysis using NVIDIA Llama 3.2 Vision or comparable models
   - E-waste classification with confidence scoring
   - Material composition analysis
   - Economic value estimation (₹ INR)
   - Environmental impact metrics

2. **National Facility Directory**
   - 421+ authorized e-waste facilities across India
   - Interactive Leaflet map with marker clustering
   - Facility categorization (Recycler, Dismantler, Refurbisher, Collection Center)
   - Real-time distance calculation from user location
   - "Near Me" functionality with GPS integration
   - Facility detail modals with complete contact information

3. **User Engagement & Rewards**
   - Credit wallet system for verified e-waste submissions
   - Transaction history and audit trails
   - Certificate generation for responsible disposal
   - Doorstep pickup scheduling
   - Facility bookmarking and saving
   - Data export capabilities

4. **Compliance & Security**
   - EPR certificate generation with unique IDs
   - Statutory authorization verification (SPCB/CPCB)
   - Secure transaction handling
   - Data privacy protection
   - Fraud prevention measures

5. **User Experience**
   - Dark/light theme persistence
   - Responsive design for all device types
   - Intuitive navigation and workflows
   - Accessibility considerations
   - Offline capabilities via localStorage
   - Multi-section application structure

## Data Sources

### Facility Data
- **Source**: Central Pollution Control Board (CPCB) and State Pollution Control Boards (SPCBs)
- **Coverage**: 36 States and Union Territories
- **Total Facilities**: 421+ authorized e-waste processing units
- **Data Points**: Facility details, contact information, processing capacities, authorization status
- **Update Frequency**: Periodic updates from regulatory sources

### Device Composition Data
- **Source**: Industry standards and e-waste recycling research
- **Coverage**: Common electronic device categories (smartphones, laptops, cables, etc.)
- **Materials Tracked**: Precious metals (Gold, Silver, Palladium), base metals (Copper, Aluminum), plastics, hazardous materials
- **Metrics**: Recovery percentages, market values, environmental impact factors

### Credit Calculation Model
- **Base Value**: Material recovery value based on current market rates
- **Modifiers**: Device condition, brand, model specifications
- **Environmental Credits**: Additional value for carbon offset and toxic waste diversion
- **Currency**: Indian Rupees (₹ INR)

## Development & Testing

### Development Workflow
1. Make changes to frontend (`index.html`, `style.css`, `app.js`) or backend (`server.js`, `services/`)
2. Test locally using `npm start` or `node server.js`
3. Verify changes in browser at `http://localhost:5000`
4. Run validation scripts as needed:
   ```bash
   # Validate facility coordinates
   python validation/validate_coordinates.py
   
   # Fix facility IDs
   python validation/fix_ids.py
   
   # Test map validation
   python map-testing/google_maps_validator.py
   ```

### Testing Guidelines
- **Unit Testing**: Individual service functions in `services/`
- **Integration Testing**: API endpoints and data flow
- **UI Testing**: Manual verification of user interactions
- **Data Validation**: Facility data integrity checks
- **AI Testing**: Image verification accuracy testing

### Environment Variables
Create `.env` file with:
```
# AI Service Keys (at least one required)
NVIDIA_API_KEY=your_key_here
# or
OPENAI_API_KEY=your_key_here

# Server Configuration
PORT=5000
NODE_ENV=development

# Optional Features
ENABLE_ANALYTICS=false
DEBUG_MODE=false
```

## Deployment

### Production Deployment
1. Ensure all environment variables are set correctly
2. Build optimized Assets (if applicable)
3. Deploy Node.js server to production environment:
   - Recommended: PM2, Docker, or cloud platforms (AWS, Heroku, Vercel)
4. Configure domain and SSL certificates
5. Set up monitoring and logging
6. Implement backup strategy for data files

### Deployment Commands
```bash
# Install production dependencies
npm install --production

# Start server with process manager
pm2 start server.js --name "ecycle-india"

# Or using Docker
docker build -to ecycle-india .
docker run -p 5000:5000 ecycle-india
```

### Environment Considerations
- **Development**: Use local `.env` with test API keys
- **Staging**: Similar to production with limited data
- **Production**: Secure API keys, optimized performance, monitoring

## Contributing

### Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Ensure code follows existing style and conventions
5. Test thoroughly
6. Submit a pull request

### Code Style
- **JavaScript**: ES6+ syntax with consistent formatting
- **HTML**: Semantic markup with accessibility considerations
- **CSS**: BEM-like naming convention with modular organization
- **Python**: PEP 8 compliance for validation scripts
- **Commits**: Descriptive commit messages referencing issues

### Reporting Issues
- Use GitHub Issues for bug reports and feature requests
- Include steps to reproduce, expected vs actual behavior
- Screenshots and console logs are helpful for UI issues
- Specify browser/device information when relevant

### Pull Request Process
1. Ensure code passes basic validation
2. Update documentation as needed
3. Request review from maintainers
4. Address feedback promptly
5. Maintain clean, focused commits

## License

This project is part of the Smart India Hackathon initiative and is intended for educational and social impact purposes.

## Contact

For questions or support regarding E-Cycle India:
- Check the `FEATURES.md` for detailed feature documentation
- Review source code comments for implementation details
- Refer to validation scripts for data quality information

---

*E-Cycle India - Empowering responsible e-waste management through technology and community engagement.*