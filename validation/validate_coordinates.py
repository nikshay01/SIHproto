#!/usr/bin/env python3
"""
Coordinate Validation Script for E-Waste Facilities
Validates facility coordinates by geocoding addresses and comparing with stored coordinates.
"""

import json
import time
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import logging
from typing import Dict, List, Tuple, Optional
import sys

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CoordinateValidator:
    def __init__(self, data_file: str, distance_threshold_km: float = 1.0):
        """
        Initialize the validator.

        Args:
            data_file: Path to the facilities JSON file
            distance_threshold_km: Maximum allowed distance between stored and geocoded coordinates (in km)
        """
        self.data_file = data_file
        self.distance_threshold_km = distance_threshold_km
        self.geolocator = Nominatim(user_agent="ehs_facility_validator")
        self.facilities = []
        self.validation_results = []

    def load_facilities(self) -> bool:
        """Load facilities data from JSON file."""
        try:
            with open(self.data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Handle different possible JSON structures
            if isinstance(data, dict) and 'all_facilities' in data:
                self.facilities = data['all_facilities']
            elif isinstance(data, list):
                self.facilities = data
            else:
                logger.error("Unexpected JSON structure")
                return False

            logger.info(f"Loaded {len(self.facilities)} facilities from {self.data_file}")
            return True
        except Exception as e:
            logger.error(f"Failed to load facilities data: {e}")
            return False

    def extract_address(self, facility: Dict) -> str:
        """
        Extract a formatted address for geocoding from facility data.

        Args:
            facility: Facility dictionary

        Returns:
            Formatted address string
        """
        # Try to use the formatted_address if available
        if 'location' in facility and 'formatted_address' in facility['location']:
            return facility['location']['formatted_address']

        # Otherwise construct address from components
        address_parts = []

        if 'address' in facility and facility['address']:
            # Clean up the address - remove extra parentheses and clean formatting
            address = facility['address'].strip()
            # Handle common patterns like "Mindi (V), Gajuwaka (M), Visakhapatnam"
            address_parts.append(address)

        if 'district' in facility and facility['district']:
            address_parts.append(facility['district'])

        if 'state' in facility and facility['state']:
            address_parts.append(facility['state'])

        # Add country for better geocoding accuracy in India
        address_parts.append("India")

        return ", ".join(filter(None, address_parts))

    def get_stored_coordinates(self, facility: Dict) -> Optional[Tuple[float, float]]:
        """
        Extract stored latitude and longitude from facility data.

        Args:
            facility: Facility dictionary

        Returns:
            Tuple of (latitude, longitude) or None if not available
        """
        try:
            if 'location' in facility:
                lat = facility['location'].get('latitude')
                lng = facility['location'].get('longitude')
                if lat is not None and lng is not None:
                    return (float(lat), float(lng))
        except (ValueError, TypeError) as e:
            logger.warning(f"Could not parse coordinates for facility {facility.get('id', 'unknown')}: {e}")
        return None

    def geocode_address(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Geocode an address using Nominatim with fallback strategies.

        Args:
            address: Address string to geocode

        Returns:
            Tuple of (latitude, longitude) or None if geocoding fails
        """
        # Try the full address first
        coords = self._try_geocode(address)
        if coords:
            return coords

        # If that fails, try a simplified version (without extra details)
        try:
            # Extract just the main components: area, city, state
            parts = [part.strip() for part in address.split(',') if part.strip()]
            if len(parts) >= 3:
                # Try: area, city, state, India
                simplified = ', '.join(parts[-4:] if len(parts) >= 4 else parts) + ", India"
                if simplified != address:
                    coords = self._try_geocode(simplified)
                    if coords:
                        return coords

                # Try: city, state, India
                if len(parts) >= 3:
                    city_state = ', '.join(parts[-3:]) + ", India"
                    if city_state != address and city_state != simplified:
                        coords = self._try_geocode(city_state)
                        if coords:
                            return coords

                # Try: state, India (last resort)
                state_india = f"{parts[-1]}, India"
                if state_india != address and state_india not in [simplified, city_state]:
                    coords = self._try_geocode(state_india)
                    if coords:
                        return coords
        except Exception as e:
            logger.debug(f"Fallback geocoding strategies failed: {e}")

        logger.warning(f"Geocoding failed for address: {address}")
        return None

    def _try_geocode(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Attempt to geocode a single address with rate limiting.

        Args:
            address: Address string to geocode

        Returns:
            Tuple of (latitude, longitude) or None if geocoding fails
        """
        try:
            # Add delay to respect rate limits
            time.sleep(1.1)  # Nominatim requires max 1 request per second

            location = self.geolocator.geocode(address, timeout=10)
            if location:
                return (location.latitude, location.longitude)
            else:
                logger.debug(f"Geocoding returned no results for address: {address}")
                return None
        except Exception as e:
            logger.debug(f"Geocoding failed for address '{address}': {e}")
            return None

    def calculate_distance(self, coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """
        Calculate distance between two coordinates using geodesic distance.

        Args:
            coord1: First coordinate tuple (lat, lng)
            coord2: Second coordinate tuple (lat, lng)

        Returns:
            Distance in kilometers
        """
        return geodesic(coord1, coord2).kilometers

    def validate_facility(self, facility: Dict) -> Dict:
        """
        Validate a single facility's coordinates.

        Args:
            facility: Facility dictionary

        Returns:
            Validation result dictionary
        """
        facility_id = facility.get('id', 'unknown')
        facility_name = facility.get('name', 'Unknown Facility')

        # Extract address for geocoding
        address = self.extract_address(facility)
        if not address:
            return {
                'facility_id': facility_id,
                'facility_name': facility_name,
                'status': 'error',
                'error': 'Could not extract address',
                'stored_coords': None,
                'geocoded_coords': None,
                'distance_km': None,
                'within_threshold': None
            }

        # Get stored coordinates
        stored_coords = self.get_stored_coordinates(facility)
        if not stored_coords:
            return {
                'facility_id': facility_id,
                'facility_name': facility_name,
                'status': 'error',
                'error': 'Could not extract stored coordinates',
                'address': address,
                'stored_coords': None,
                'geocoded_coords': None,
                'distance_km': None,
                'within_threshold': None
            }

        # Geocode the address
        geocoded_coords = self.geocode_address(address)
        if not geocoded_coords:
            return {
                'facility_id': facility_id,
                'facility_name': facility_name,
                'status': 'error',
                'error': 'Geocoding failed',
                'address': address,
                'stored_coords': stored_coords,
                'geocoded_coords': None,
                'distance_km': None,
                'within_threshold': None
            }

        # Calculate distance
        distance_km = self.calculate_distance(stored_coords, geocoded_coords)
        within_threshold = distance_km <= self.distance_threshold_km

        # Determine status
        if not within_threshold:
            status = 'mismatch'
        else:
            status = 'valid'

        return {
            'facility_id': facility_id,
            'facility_name': facility_name,
            'status': status,
            'address': address,
            'stored_coords': stored_coords,
            'geocoded_coords': geocoded_coords,
            'distance_km': round(distance_km, 3),
            'within_threshold': within_threshold,
            'error': None
        }

    def run_validation(self) -> List[Dict]:
        """
        Run validation on all facilities.

        Returns:
            List of validation result dictionaries
        """
        if not self.facilities:
            logger.error("No facilities loaded")
            return []

        logger.info(f"Starting validation of {len(self.facilities)} facilities...")
        logger.info(f"Distance threshold: {self.distance_threshold_km} km")

        results = []
        for i, facility in enumerate(self.facilities, 1):
            logger.info(f"Processing facility {i}/{len(self.facilities)}: {facility.get('id', 'unknown')}")
            result = self.validate_facility(facility)
            results.append(result)

            # Log progress every 50 facilities
            if i % 50 == 0:
                logger.info(f"Processed {i} facilities...")

        self.validation_results = results
        logger.info("Validation complete!")
        return results

    def generate_report(self) -> Dict:
        """
        Generate a summary report of validation results.

        Returns:
            Report dictionary
        """
        if not self.validation_results:
            return {}

        total = len(self.validation_results)
        valid = sum(1 for r in self.validation_results if r.get('status') == 'valid')
        mismatched = sum(1 for r in self.validation_results if r.get('status') == 'mismatch')
        errors = sum(1 for r in self.validation_results if r.get('status') == 'error')

        # Get details of mismatched facilities
        mismatched_facilities = [
            {
                'facility_id': r['facility_id'],
                'facility_name': r['facility_name'],
                'distance_km': r['distance_km'],
                'stored_coords': r['stored_coords'],
                'geocoded_coords': r['geocoded_coords'],
                'address': r['address']
            }
            for r in self.validation_results
            if r.get('status') == 'mismatch'
        ]

        # Sort by distance (worst first)
        mismatched_facilities.sort(key=lambda x: x['distance_km'], reverse=True)

        report = {
            'summary': {
                'total_facilities': total,
                'valid_coordinates': valid,
                'mismatched_coordinates': mismatched,
                'errors': errors,
                'validation_threshold_km': self.distance_threshold_km
            },
            'mismatched_facilities': mismatched_facilities[:20],  # Top 20 worst mismatches
            'all_mismatched_facilities': mismatched_facilities
        }

        return report

    def save_results(self, output_file: str):
        """
        Save validation results to JSON file.

        Args:
            output_file: Path to output JSON file
        """
        results_data = {
            'validation_parameters': {
                'distance_threshold_km': self.distance_threshold_km,
                'total_facilities_processed': len(self.validation_results)
            },
            'results': self.validation_results,
            'report': self.generate_report()
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results_data, f, indent=2, ensure_ascii=False)

        logger.info(f"Validation results saved to {output_file}")

def main():
    """Main function to run the coordinate validation."""
    import argparse

    parser = argparse.ArgumentParser(description='Validate e-waste facility coordinates')
    parser.add_argument('--data-file', default='D:\\nikshay\\coding\\SIH\\main-project\\data\\e-waste-facilities\\all_facilities.json',
                        help='Path to facilities JSON file')
    parser.add_argument('--threshold', type=float, default=1.0,
                        help='Distance threshold in kilometers (default: 1.0)')
    parser.add_argument('--output', default='D:\\nikshay\\coding\\SIH\\main-project\\validation\\validation_results.json',
                        help='Path to output JSON file')
    parser.add_argument('--log-level', default='INFO',
                        choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
                        help='Logging level (default: INFO)')

    args = parser.parse_args()

    # Set logging level
    logging.getLogger().setLevel(getattr(logging, args.log_level))

    # Initialize validator
    validator = CoordinateValidator(args.data_file, args.threshold)

    # Load data
    if not validator.load_facilities():
        logger.error("Failed to load facilities data. Exiting.")
        sys.exit(1)

    # Run validation
    results = validator.run_validation()

    # Generate and display report
    report = validator.generate_report()

    print("\n" + "="*60)
    print("COORDINATE VALIDATION REPORT")
    print("="*60)
    print(f"Total facilities processed: {report['summary']['total_facilities']}")
    print(f"Valid coordinates: {report['summary']['valid_coordinates']}")
    print(f"Mismatched coordinates: {report['summary']['mismatched_coordinates']}")
    print(f"Errors: {report['summary']['errors']}")
    print(f"Validation threshold: {report['summary']['validation_threshold_km']} km")
    print("="*60)

    if report['mismatched_facilities']:
        print(f"\nTop {min(10, len(report['mismatched_facilities']))} facilities with coordinate mismatches:")
        print("-" * 60)
        for i, fac in enumerate(report['mismatched_facilities'][:10], 1):
            print(f"{i}. {fac['facility_name']} (ID: {fac['facility_id']})")
            print(f"   Distance: {fac['distance_km']} km")
            print(f"   Stored: {fac['stored_coords']}")
            print(f"   Geocoded: {fac['geocoded_coords']}")
            print()
    else:
        print("\nNo coordinate mismatches found within the threshold!")

    # Save detailed results
    validator.save_results(args.output)

    # Return appropriate exit code
    if report['summary']['mismatched_coordinates'] > 0:
        logger.warning(f"Found {report['summary']['mismatched_coordinates']} facilities with coordinate mismatches")
        sys.exit(1)  # Exit with error code if mismatches found
    else:
        logger.info("All facilities have valid coordinates within threshold")
        sys.exit(0)

if __name__ == "__main__":
    main()