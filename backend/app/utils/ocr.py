import re
from PIL import Image
import pytesseract

def extract_text(image_path):
    """
    Opens the image and uses pytesseract to extract Bengali text.
    """
    image = Image.open(image_path)
    text = pytesseract.image_to_string(image, lang='ben')
    return text

def split_into_sentences_bn(text):
    """
    Split Bengali text into sentences based on punctuation marks.
    This implementation splits on the Bengali full stop (।), question marks, and exclamation points,
    retaining the punctuation with the sentence.
    """
    # Replace newline characters with space to avoid breaking sentences unexpectedly.
    text = text.replace('\n', ' ')
    # Use regex to capture sentences ending with one of the punctuation marks.
    pattern = re.compile(r'([^।?!]+[।?!])')
    sentences = pattern.findall(text)
    # Capture any trailing text that does not end with punctuation, but only if it contains Bengali letters.
    remainder = pattern.sub('', text).strip()
    if remainder and re.search(r'[\u0980-\u09FF]', remainder):
        sentences.append(remainder)
    # Remove extra whitespace from each sentence.
    sentences = [s.strip() for s in sentences if s.strip()]
    return sentences

def merge_too_short_sentences(sents, min_len=3):
    """
    Merge sentences that are too short.
    """
    merged = []
    skip = False
    for i, s in enumerate(sents):
        if skip:
            skip = False
            continue
        # Remove punctuation and spaces to check length
        s_clean = s.strip("।?!,. ")
        if len(s_clean) < min_len and i < len(sents) - 1:
            merged.append((s + " " + sents[i+1]).strip())
            skip = True
        else:
            merged.append(s)
    return merged



def build_paragraphs_and_sentences_from_text(full_text):
    """
    Process the full text into paragraphs and sentences.
    Splits text into paragraphs based on double newline characters,
    then splits each paragraph into sentences based on punctuation.
    """
    full_text = full_text.strip()
    # Split by double newline to get paragraphs
    paragraphs_raw = [p.strip() for p in full_text.split('\n\n') if p.strip()]
    paragraph_objs = []
    for idx, para in enumerate(paragraphs_raw):
        # Split sentences in the paragraph using our custom splitter
        sents = split_into_sentences_bn(para)
        sents = merge_too_short_sentences(sents, min_len=3)
        sentence_objs = []
        for s_idx, s in enumerate(sents):
            sentence_objs.append({
                "text": s,
                "sentence_idx": s_idx,
                "sentence_id": f"p{idx}_s{s_idx}"
            })
        paragraph_objs.append({
            "paragraph_idx": idx,
            "sentences": sentence_objs
        })
    return paragraph_objs
