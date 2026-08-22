#!/usr/bin/env python3
"""
Google Maps Coordinate Validator for E-Waste Facilities
Validates facility coordinates by comparing Google Maps geocoding results with stored coordinates.
"""

import json
import time
import os
import requests
from typing import Dict, List, Tuple, Optional
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GoogleMapsCoordinateValidator:
    def __init__(self, data_file: str, distance_threshold_km: float = 2.0):
        """
        Initialize the validator.

        Args:
            data_file: Path to the facilities JSON file
            distance_threshold_km: Maximum allowed distance between stored and Google Maps coordinates (in km)
        """
        self.data_file = data_file
        self.distance_threshold_km = distance_threshold_km
        self.api_key = os.getenv('MAPS_API_KEY')
        if not self.api_key:
            raise ValueError("MAPS_API_KEY not found in environment variables")
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

    def geocode_address(self, address: str) -> Optional[Dict]:
        """
        Geocode an address using Google Maps Geocoding API.

        Args:
            address: Address string to geocode

        Returns:
            Dictionary with geocoding results or None if geocoding fails
        """
        try:
            # Google Maps Geocoding API endpoint
            url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {
                'address': address,
                'key': self.api_key
            }

            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            result = response.json()

            if result['status'] == 'OK' and result['results']:
                # Take the first result
                location = result['results'][0]['geometry']['location']
                formatted_address = result['results'][0]['formatted_address']

                return {
                    'latitude': location['lat'],
                    'longitude': location['lng'],
                    'formatted_address': formatted_address
                }
            else:
                logger.warning(f"Geocoding returned no results for address: {address}. Status: {result['status']}")
                return None

        except Exception as e:
            logger.error(f"Geocoding failed for address '{address}': {e}")
            return None

    def calculate_distance(self, coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """
        Calculate distance between two coordinates using Haversine formula.

        Args:
            coord1: First coordinate tuple (lat, lng)
            coord2: Second coordinate tuple (lat, lng)

        Returns:
            Distance in kilometers
        """
        import math

        lat1, lng1 = coord1
        lat2, lng2 = coord2

        # Convert decimal degrees to radians
        lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])

        # Haversine formula
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
        c = 2 * math.asin(math.sqrt(a))
        r = 6371  # Radius of earth in kilometers
        return c * r

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
                'google_maps_coords': None,
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
                'google_maps_coords': None,
                'distance_km': None,
                'within_threshold': None
            }

        # Geocode the address using Google Maps
        geocoded_result = self.geocode_address(address)
        if not geocoded_result:
            return {
                'facility_id': facility_id,
                'facility_name': facility_name,
                'status': 'error',
                'error': 'Google Maps geocoding failed',
                'address': address,
                'stored_coords': stored_coords,
                'google_maps_coords': None,
                'distance_km': None,
                'within_threshold': None
            }

        # Extract coordinates from Google Maps result
        google_maps_coords = (geocoded_result['latitude'], geocoded_result['longitude'])

        # Calculate distance
        distance_km = self.calculate_distance(stored_coords, google_maps_coords)
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
            'stored_coords': list(stored_coords),
            'google_maps_coords': list(google_maps_coords),
            'google_maps_address': geocoded_result['formatted_address'],
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
        logger.info(f"Using Google Maps Geocoding API")

        results = []
        for i, facility in enumerate(self.facilities, 1):
            logger.info(f"Processing facility {i}/{len(self.facilities)}: {facility.get('id', 'unknown')}")
            result = self.validate_facility(facility)
            results.append(result)

            # Log progress every 10 facilities
            if i % 10 == 0:
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
                'google_maps_coords': r['google_maps_coords'],
                'google_maps_address': r.get('google_maps_address'),
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
                'service_used': 'Google Maps Geocoding API',
                'distance_threshold_km': self.distance_threshold_km,
                'total_facilities_processed': len(self.validation_results)
            },
            'results': self.validation_results,
            'report': self.generate_report()
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results_data, f, indent=2, ensure_ascii=False)

        logger.info(f"Validation results saved to {output_file}")

    def generate_coordinate_sources_report(self, output_file: str):
        """
        Generate a report documenting the source of official coordinates for each facility.

        Args:
            output_file: Path to output JSON file
        """
        coordinate_sources = []

        for facility in self.facilities:
            facility_id = facility.get('id', 'unknown')
            facility_name = facility.get('name', 'Unknown Facility')
            stored_coords = self.get_stored_coordinates(facility)

            # Determine the likely source of coordinates
            source_info = self.determine_coordinate_source(facility)

            coordinate_sources.append({
                'facility_id': facility_id,
                'facility_name': facility_name,
                'official_coordinates': list(stored_coords) if stored_coords else None,
                'coordinate_source': source_info['source'],
                'source_details': source_info['details'],
                'verification_method': source_info['verification']
            })

        sources_report = {
            'coordinate_sources': coordinate_sources,
            'summary': {
                'total_facilities': len(coordinate_sources),
                'report_generated_at': time.strftime('%Y-%m-%d %H:%M:%S'),
                'note': 'This report documents the presumed source of official coordinates (location.lat/lng) in the facility data.'
            }
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(sources_report, f, indent=2, ensure_ascii=False)

        logger.info(f"Coordinate sources report saved to {output_file}")

    def determine_coordinate_source(self, facility: Dict) -> Dict:
        """
        Determine the likely source of official coordinates for a facility.

        Args:
            facility: Facility dictionary

        Returns:
            Dictionary with source information
        """
        # Check if there's explicit source information
        if 'location' in facility:
            location = facility['location']

            # Check if there's a Google Maps URL (suggests verification via Google Maps)
            if 'google_maps_url' in location and location['google_maps_url']:
                return {
                    'source': 'Verified via Google Maps',
                    'details': f"Google Maps URL present: {location['google_maps_url']}",
                    'verification': 'URL validation'
                }

            # Check if there's a coordinates URL
            if 'coordinates_url' in location and location['coordinates_url']:
                return {
                    'source': 'Google Maps Coordinates URL',
                    'details': f"Coordinates URL present: {location['coordinates_url']}",
                    'verification': 'URL validation'
                }

        # Based on dataset structure and metadata, coordinates likely come from SPCB records
        # Check if there's authorization information that suggests official source
        if facility.get('is_authorized') and facility.get('authorization_by'):
            return {
                'source': 'State Pollution Control Board Official Records',
                'details': f"Authorized by {facility.get('authorization_by')} under {facility.get('regulatory_compliance', 'E-Waste Rules')}",
                'verification': 'Authorization documentation'
            }

        # Default assumption based on dataset context
        return {
            'source': 'Likely from Facility Registration/Authorization Documents',
            'details': 'Coordinates appear to be from official facility registration or authorization documents',
            'verification': 'Inferred from dataset structure and metadata'
        }

def main():
    """Main function to run the coordinate validation."""
    import argparse

    parser = argparse.ArgumentParser(description='Validate e-waste facility coordinates using Google Maps API')
    parser.add_argument('--data-file', default='D:\\nikshay\\coding\\SIH\\main-project\\validation\\quick10.json',
                        help='Path to facilities JSON file')
    parser.add_argument('--threshold', type=float, default=2.0,
                        help='Distance threshold in kilometers (default: 2.0)')
    parser.add_argument('--output', default='D:\\nikshay\\coding\\SIH\\main-project\\google_maps_validation_results.json',
                        help='Path to output JSON file')
    parser.add_argument('--sources-output', default='D:\\nikshay\\coding\\SIH\\main-project\\coordinate_sources.json',
                        help='Path to coordinate sources output JSON file')
    parser.add_argument('--log-level', default='INFO',
                        choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
                        help='Logging level (default: INFO)')

    args = parser.parse_args()

    # Set logging level
    logging.getLogger().setLevel(getattr(logging, args.log_level))

    # Initialize validator
    validator = GoogleMapsCoordinateValidator(args.data_file, args.threshold)

    # Load data
    if not validator.load_facilities():
        logger.error("Failed to load facilities data. Exiting.")
        return(1)

    # Run validation
    results = validator.run_validation()

    # Generate and display report
    report = validator.generate_report()

    print("\n" + "="*60)
    print("GOOGLE MAPS COORDINATE VALIDATION REPORT")
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
            print(f"   Google Maps: {fac['google_maps_coords']}")
            print()
    else:
        print("\nNo coordinate mismatches found within the threshold!")

    # Save detailed results
    validator.save_results(args.output)

    # Generate and save coordinate sources report
    validator.generate_coordinate_sources_report(args.sources_output)

    # Return appropriate exit code
    if report['summary']['mismatched_coordinates'] > 0:
        logger.warning(f"Found {report['summary']['mismatched_coordinates']} facilities with coordinate mismatches")
        return(1)
    else:
        logger.info("All facilities have valid coordinates within threshold")
        return(0)

if __name__ == "__main__":
    exit(main())