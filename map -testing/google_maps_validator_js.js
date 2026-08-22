/**
 * Google Maps Coordinate Validator for E-Waste Facilities (JavaScript/Node.js version)
 * Validates facility coordinates by comparing Google Maps geocoding results with stored coordinates.
 */

require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

// Check if axios is installed, if not install it
try {
  require.resolve('axios');
} catch (e) {
  console.log('Installing axios...');
  const { execSync } = require('child_process');
  execSync('npm install axios', { stdio: 'inherit' });
}

class GoogleMapsCoordinateValidator {
  constructor(dataFile, distanceThresholdKm = 2.0) {
    this.dataFile = dataFile;
    this.distanceThresholdKm = distanceThresholdKm;
    this.apiKey = process.env.MAPS_API_KEY;

    console.log('\n[DEBUG] === Google Maps API Initialization ===');
    if (!this.apiKey) {
      console.error('[DEBUG ERROR] MAPS_API_KEY is not defined in environment variables or .env file!');
      throw new Error('MAPS_API_KEY not found in environment variables');
    }

    const maskedKey = this.apiKey.length > 8 
      ? `${this.apiKey.substring(0, 6)}...${this.apiKey.substring(this.apiKey.length - 4)} (length: ${this.apiKey.length})`
      : '*** (too short)';
    console.log(`[DEBUG] Loaded MAPS_API_KEY: ${maskedKey}`);
    console.log(`[DEBUG] Target data file: ${this.dataFile}`);
    console.log('[DEBUG] =======================================\n');

    this.facilities = [];
    this.validationResults = [];
  }

  // Load facilities data from JSON file
  loadFacilities() {
    try {
      const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));

      // Handle different possible JSON structures
      if (typeof data === 'object' && data.all_facilities) {
        this.facilities = data.all_facilities;
      } else if (Array.isArray(data)) {
        this.facilities = data;
      } else {
        throw new Error('Unexpected JSON structure');
      }

      console.log(`Loaded ${this.facilities.length} facilities from ${this.dataFile}`);
      return true;
    } catch (error) {
      console.error(`Failed to load facilities data: ${error.message}`);
      return false;
    }
  }

  // Extract a formatted address for geocoding from facility data
  extractAddress(facility) {
    // Try to use the formatted_address if available
    if (facility.location && facility.location.formatted_address) {
      return facility.location.formatted_address;
    }

    // Otherwise construct address from components
    const addressParts = [];

    if (facility.address && facility.address.trim()) {
      // Clean up the address - remove extra parentheses and clean formatting
      let address = facility.address.trim();
      // Handle common patterns like "Mindi (V), Gajuwaka (M), Visakhapatnam"
      addressParts.push(address);
    }

    if (facility.district && facility.district.trim()) {
      addressParts.push(facility.district.trim());
    }

    if (facility.state && facility.state.trim()) {
      addressParts.push(facility.state.trim());
    }

    // Add country for better geocoding accuracy in India
    addressParts.push("India");

    return addressParts.filter(part => part).join(', ');
  }

  // Extract stored latitude and longitude from facility data
  getStoredCoordinates(facility) {
    try {
      if (facility.location) {
        const lat = facility.location.latitude;
        const lng = facility.location.longitude;
        if (lat !== null && lat !== undefined && lng !== null && lng !== undefined) {
          return [parseFloat(lat), parseFloat(lng)];
        }
      }
    } catch (error) {
      console.warn(`Could not parse coordinates for facility ${facility.id || 'unknown'}: ${error.message}`);
    }
    return null;
  }

  // Geocode an address using Google Maps Geocoding API
  async geocodeAddress(address) {
    const url = 'https://maps.googleapis.com/maps/api/geocode/json';
    const params = {
      address: address,
      key: this.apiKey
    };

    console.log(`\n------------------------------------------------------------`);
    console.log(`[DEBUG] Sending Geocoding Request:`);
    console.log(`  -> URL: ${url}`);
    console.log(`  -> Address: "${address}"`);
    console.log(`  -> API Key (masked): ${this.apiKey.substring(0, 6)}...${this.apiKey.slice(-4)}`);

    try {
      const response = await axios.get(url, { params, timeout: 10000 });

      console.log(`[DEBUG] Response HTTP Status: ${response.status} ${response.statusText}`);
      console.log(`[DEBUG] Google API Status: ${response.data.status}`);

      if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
        // Take the first result
        const result = response.data.results[0];
        const location = result.geometry.location;

        console.log(`[DEBUG] Geocoding SUCCESS:`);
        console.log(`  -> Coordinates: (${location.lat}, ${location.lng})`);
        console.log(`  -> Matched Address: "${result.formatted_address}"`);
        console.log(`------------------------------------------------------------\n`);

        return {
          latitude: location.lat,
          longitude: location.lng,
          formatted_address: result.formatted_address
        };
      } else {
        console.warn(`[DEBUG WARNING] Geocoding returned non-OK status: ${response.data.status}`);
        if (response.data.error_message) {
          console.error(`[DEBUG ERROR MESSAGE FROM GOOGLE]: "${response.data.error_message}"`);
        }
        console.log(`[DEBUG FULL RESPONSE PAYLOAD]:`, JSON.stringify(response.data, null, 2));

        if (response.data.status === 'REQUEST_DENIED') {
          console.error(`\n[DIAGNOSTIC HINTS FOR 'REQUEST_DENIED']:\n` +
            `  1. "Geocoding API" might NOT be enabled for this API Key in Google Cloud Console.\n` +
            `     -> Go to: https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com\n` +
            `     -> Click "ENABLE".\n` +
            `  2. Billing might NOT be linked/active on the Google Cloud Project.\n` +
            `     -> Go to: https://console.cloud.google.com/billing\n` +
            `  3. Key Restrictions:\n` +
            `     -> If the API key is restricted to "HTTP referrers (web sites)", Node.js backend requests will be REJECTED.\n` +
            `     -> Solution: Set Application restrictions to "IP addresses" or "None" for backend use, OR create a separate server key.\n` +
            `     -> If API restrictions are enabled, ensure "Geocoding API" is checked in the allowed list.\n` +
            `  4. Invalid API Key: Ensure MAPS_API_KEY in .env matches your actual Google Cloud key without quotes or extra whitespace.\n`
          );
        }
        console.log(`------------------------------------------------------------\n`);
        return null;
      }
    } catch (error) {
      console.error(`[DEBUG AXIOS ERROR] Geocoding failed for address '${address}':`);
      console.error(`  -> Message: ${error.message}`);
      if (error.response) {
        console.error(`  -> HTTP Status: ${error.response.status}`);
        console.error(`  -> Response Data:`, JSON.stringify(error.response.data, null, 2));
      }
      console.log(`------------------------------------------------------------\n`);
      return null;
    }
  }

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(coord1, coord2) {
    const [lat1, lng1] = coord1;
    const [lat2, lng2] = coord2;

    const toRad = (value) => value * Math.PI / 180;
    const R = 6371; // Earth's radius in km

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Validate a single facility's coordinates
  async validateFacility(facility) {
    const facilityId = facility.id || 'unknown';
    const facilityName = facility.name || 'Unknown Facility';

    // Extract address for geocoding
    const address = this.extractAddress(facility);
    if (!address) {
      return {
        facility_id: facilityId,
        facility_name: facilityName,
        status: 'error',
        error: 'Could not extract address',
        stored_coords: null,
        google_maps_coords: null,
        distance_km: null,
        within_threshold: null
      };
    }

    // Get stored coordinates
    const storedCoords = this.getStoredCoordinates(facility);
    if (!storedCoords) {
      return {
        facility_id: facilityId,
        facility_name: facilityName,
        status: 'error',
        error: 'Could not extract stored coordinates',
        address: address,
        stored_coords: null,
        google_maps_coords: null,
        distance_km: null,
        within_threshold: null
      };
    }

    // Geocode the address using Google Maps
    const geocodedResult = await this.geocodeAddress(address);
    if (!geocodedResult) {
      return {
        facility_id: facilityId,
        facility_name: facilityName,
        status: 'error',
        error: 'Google Maps geocoding failed',
        address: address,
        stored_coords: storedCoords,
        google_maps_coords: null,
        distance_km: null,
        within_threshold: null
      };
    }

    // Extract coordinates from Google Maps result
    const googleMapsCoords = [geocodedResult.latitude, geocodedResult.longitude];

    // Calculate distance
    const distanceKm = this.calculateDistance(storedCoords, googleMapsCoords);
    const withinThreshold = distanceKm <= this.distanceThresholdKm;

    // Determine status
    const status = withinThreshold ? 'valid' : 'mismatch';

    return {
      facility_id: facilityId,
      facility_name: facilityName,
      status: status,
      address: address,
      stored_coords: storedCoords,
      google_maps_coords: googleMapsCoords,
      google_maps_address: geocodedResult.formatted_address,
      distance_km: parseFloat(distanceKm.toFixed(3)),
      within_threshold: withinThreshold,
      error: null
    };
  }

  // Run validation on all facilities
  async runValidation() {
    if (!this.facilities.length) {
      console.error('No facilities loaded');
      return [];
    }

    console.log(`Starting validation of ${this.facilities.length} facilities...`);
    console.log(`Distance threshold: ${this.distanceThresholdKm} km`);
    console.log(`Using Google Maps Geocoding API`);

    const results = [];
    for (let i = 0; i < this.facilities.length; i++) {
      const facility = this.facilities[i];
      console.log(`Processing facility ${i + 1}/${this.facilities.length}: ${facility.id || 'unknown'}`);

      const result = await this.validateFacility(facility);
      results.push(result);

      // Log progress every 10 facilities
      if ((i + 1) % 10 === 0) {
        console.log(`Processed ${i + 1} facilities...`);
      }

      // Rate limiting: Google Maps API allows 50 requests/second, but we'll be conservative
      // Add delay to be safe (especially if user has quota limits)
      if (i < this.facilities.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      }
    }

    this.validationResults = results;
    console.log('Validation complete!');
    return results;
  }

  // Generate a summary report of validation results
  generateReport() {
    if (!this.validationResults.length) {
      return {};
    }

    const total = this.validationResults.length;
    const valid = this.validationResults.filter(r => r.status === 'valid').length;
    const mismatched = this.validationResults.filter(r => r.status === 'mismatch').length;
    const errors = this.validationResults.filter(r => r.status === 'error').length;

    // Get details of mismatched facilities
    const mismatchedFacilities = this.validationResults
      .filter(r => r.status === 'mismatch')
      .map(r => ({
        facility_id: r.facility_id,
        facility_name: r.facility_name,
        distance_km: r.distance_km,
        stored_coords: r.stored_coords,
        google_maps_coords: r.google_maps_coords,
        google_maps_address: r.google_maps_address,
        address: r.address
      }))
      .sort((a, b) => b.distance_km - a.distance_km); // Sort by distance (worst first)

    const report = {
      summary: {
        total_facilities: total,
        valid_coordinates: valid,
        mismatched_coordinates: mismatched,
        errors: errors,
        validation_threshold_km: this.distanceThresholdKm
      },
      mismatched_facilities: mismatchedFacilities.slice(0, 20), // Top 20 worst mismatches
      all_mismatched_facilities: mismatchedFacilities
    };

    return report;
  }

  // Save validation results to JSON file
  saveResults(outputFile) {
    const resultsData = {
      validation_parameters: {
        service_used: 'Google Maps Geocoding API',
        distance_threshold_km: this.distanceThresholdKm,
        total_facilities_processed: this.validationResults.length
      },
      results: this.validationResults,
      report: this.generateReport()
    };

    fs.writeFileSync(outputFile, JSON.stringify(resultsData, null, 2), 'utf8');
    console.log(`Validation results saved to ${outputFile}`);
  }

  // Generate a report documenting the source of official coordinates for each facility
  generateCoordinateSourcesReport(outputFile) {
    const coordinateSources = this.facilities.map(facility => {
      const facilityId = facility.id || 'unknown';
      const facilityName = facility.name || 'Unknown Facility';
      const storedCoords = this.getStoredCoordinates(facility);

      // Determine the likely source of coordinates
      const sourceInfo = this.determineCoordinateSource(facility);

      return {
        facility_id: facilityId,
        facility_name: facilityName,
        official_coordinates: storedCoords ? [...storedCoords] : null,
        coordinate_source: sourceInfo.source,
        source_details: sourceInfo.details,
        verification_method: sourceInfo.verification
      };
    });

    const sourcesReport = {
      coordinate_sources: coordinateSources,
      summary: {
        total_facilities: coordinateSources.length,
        report_generated_at: new Date().toISOString(),
        note: 'This report documents the presumed source of official coordinates (location.lat/lng) in the facility data.'
      }
    };

    fs.writeFileSync(outputFile, JSON.stringify(sourcesReport, null, 2), 'utf8');
    console.log(`Coordinate sources report saved to ${outputFile}`);
  }

  // Determine the likely source of official coordinates for a facility
  determineCoordinateSource(facility) {
    // Check if there's explicit source information
    if (facility.location) {
      const location = facility.location;

      // Check if there's a Google Maps URL (suggests verification via Google Maps)
      if (location.google_maps_url && location.google_maps_url.trim() !== '') {
        return {
          source: 'Verified via Google Maps',
          details: `Google Maps URL present: ${location.google_maps_url}`,
          verification: 'URL validation'
        };
      }

      // Check if there's a coordinates URL
      if (location.coordinates_url && location.coordinates_url.trim() !== '') {
        return {
          source: 'Google Maps Coordinates URL',
          details: `Coordinates URL present: ${location.coordinates_url}`,
          verification: 'URL validation'
        };
      }
    }

    // Based on dataset structure and metadata, coordinates likely come from SPCB records
    // Check if there's authorization information that suggests official source
    if (facility.is_authorized && facility.authorization_by) {
      return {
        source: 'State Pollution Control Board Official Records',
        details: `Authorized by ${facility.authorization_by} under ${facility.regulatory_compliance || 'E-Waste Rules'}`,
        verification: 'Authorization documentation'
      };
    }

    // Default assumption based on dataset context
    return {
      source: 'Likely from Facility Registration/Authorization Documents',
      details: 'Coordinates appear to be from official facility registration or authorization documents',
      verification: 'Inferred from dataset structure and metadata'
    };
  }
}

// Main function to run the coordinate validation
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const argMap = {};

  for (let i = 0; i < args.length; i += 2) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      argMap[key] = args[i + 1];
    }
  }

  const dataFile = argMap['data-file'] || 'D:\\nikshay\\coding\\SIH\\main-project\\validation\\quick10.json';
  const threshold = parseFloat(argMap['threshold']) || 2.0;
  const outputFile = argMap['output'] || 'D:\\nikshay\\coding\\SIH\\main-project\\google_maps_validation_results_js.json';
  const sourcesOutputFile = argMap['sources-output'] || 'D:\\nikshay\\coding\\SIH\\main-project\\coordinate_sources_js.json';
  const logLevel = argMap['log-level'] || 'INFO';

  // Set log level (basic implementation)
  if (logLevel === 'DEBUG') {
    // Enable more verbose logging if needed
  }

  try {
    // Initialize validator
    const validator = new GoogleMapsCoordinateValidator(dataFile, threshold);

    // Load data
    if (!validator.loadFacilities()) {
      console.error('Failed to load facilities data. Exiting.');
      process.exit(1);
    }

    // Run validation
    const results = await validator.runValidation();

    // Generate and display report
    const report = validator.generateReport();

    console.log('\n' + '='.repeat(60));
    console.log('GOOGLE MAPS COORDINATE VALIDATION REPORT');
    console.log('='.repeat(60));
    console.log(`Total facilities processed: ${report.summary.total_facilities}`);
    console.log(`Valid coordinates: ${report.summary.valid_coordinates}`);
    console.log(`Mismatched coordinates: ${report.summary.mismatched_coordinates}`);
    console.log(`Errors: ${report.summary.errors}`);
    console.log(`Validation threshold: ${report.summary.validation_threshold_km} km`);
    console.log('='.repeat(60));

    if (report.mismatched_facilities.length > 0) {
      console.log(`\nTop ${Math.min(10, report.mismatched_facilities.length)} facilities with coordinate mismatches:`);
      console.log('-'.repeat(60));
      for (let i = 0; i < Math.min(10, report.mismatched_facilities.length); i++) {
        const fac = report.mismatched_facilities[i];
        console.log(`${i + 1}. ${fac.facility_name} (ID: ${fac.facility_id})`);
        console.log(`   Distance: ${fac.distance_km} km`);
        console.log(`   Stored: [${fac.stored_coords.join(', ')}]`);
        console.log(`   Google Maps: [${fac.google_maps_coords.join(', ')}]`);
        console.log();
      }
    } else {
      console.log('\nNo coordinate mismatches found within the threshold!');
    }

    // Save detailed results
    validator.saveResults(outputFile);

    // Generate and save coordinate sources report
    validator.generateCoordinateSourcesReport(sourcesOutputFile);

    // Return appropriate exit code
    if (report.summary.mismatched_coordinates > 0) {
      console.warning(`Found ${report.summary.mismatched_coordinates} facilities with coordinate mismatches`);
      process.exit(1);
    } else {
      console.log('All facilities have valid coordinates within threshold');
      process.exit(0);
    }
  } catch (error) {
    console.error(`Error in validation process: ${error.message}`);
    if (logLevel === 'DEBUG') {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = GoogleMapsCoordinateValidator;