import sys
import os

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from enhanced_rabinkarp import check_plagiarism

# Test documents
source_doc = """
The culture of the Philippines is a mix of eastern and western influences. 
Spanish and American colonization had a significant impact on the traditions of the country.

Education is a top priority for Filipino families. 
Many students strive to graduate from prestigious universities to secure a better future for their families.
"""

suspect_doc = """
Ang kultura ng Pilipinas ay kombinasyon ng eastern at western na impluwensya. 
Ang pananakop ng Kastila at Amerikano ay may matinding epekto sa mga tradisyon ng ating bansa.

Ang edukasyon ay pangunahing priority para sa mga pamilyang Pilipino. 
Maraming estudyante ang nagsisikap na makapagtapos sa mga sikat na unibersidad upang makamit ang magandang kinabukasan.
"""

def run_test():
    print("\nRunning Direct Algorithm Test...")
    result = check_plagiarism(
        source=source_doc,
        suspect=suspect_doc,
        window=3
    )
    
    print("\n=== PLAGIARISM TEST RESULTS ===")
    print(f"Similarity Score: {result['similarity_percent']}%")
    print(f"Matched Sentences: {result['matched_count']} / {result['total_sentences']}")
    
    print("\n--- Normalization Check ---")
    print(f"Normalized Source Sample: {result['normalized_source'][:150]}")
    print(f"Normalized Suspect Sample: {result['normalized_suspect'][:150]}")

if __name__ == "__main__":
    run_test()
