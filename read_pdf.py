#!/usr/bin/env python3
"""
PDF okuma scripti - ASHRAE ve diğer PDF dosyaları için
"""

import sys
import os

def read_pdf_basic(pdf_path):
    """
    PDF'i temel text olarak okumaya çalış
    """
    try:
        # PDF'i binary olarak aç
        with open(pdf_path, 'rb') as file:
            content = file.read()
            
        # Basit text extraction - PDF içindeki text stream'leri bul
        text_parts = []
        
        # PDF text stream pattern: BT ... ET arası
        start_marker = b'BT'
        end_marker = b'ET'
        
        pos = 0
        while pos < len(content):
            start = content.find(start_marker, pos)
            if start == -1:
                break
                
            end = content.find(end_marker, start)
            if end == -1:
                break
                
            # Text stream içeriğini al
            text_content = content[start+2:end]
            
            # Basit text extraction - parantez içindeki metinleri bul
            text_start = 0
            while text_start < len(text_content):
                paren_start = text_content.find(b'(', text_start)
                if paren_start == -1:
                    break
                    
                paren_end = text_content.find(b')', paren_start)
                if paren_end == -1:
                    break
                    
                try:
                    text = text_content[paren_start+1:paren_end].decode('utf-8', errors='ignore')
                    if text.strip():
                        text_parts.append(text)
                except:
                    pass
                    
                text_start = paren_end + 1
                
            pos = end + 2
            
        return '\n'.join(text_parts)
        
    except Exception as e:
        return f"Hata: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Kullanım: python3 read_pdf.py <pdf_dosyasi>")
        sys.exit(1)
        
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(f"Dosya bulunamadı: {pdf_path}")
        sys.exit(1)
        
    print(f"PDF okunuyor: {pdf_path}")
    print("-" * 50)
    
    text = read_pdf_basic(pdf_path)
    print(text[:5000])  # İlk 5000 karakter
    
    if len(text) > 5000:
        print("\n... (daha fazla içerik var)")