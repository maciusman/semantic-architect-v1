Jasne. Rozumiem, że potrzebujesz finalnego, kompletnego pliku `README.md`, który będzie pełnił rolę instrukcji obsługi, dokumentacji technicznej i przewodnika strategicznego dla użytkowników aplikacji. Uwzględniam dodanie eksportu pobranych treści i skupiam się na maksymalnej precyzji i wyczerpaniu każdego tematu.

Oto gotowy plik.

---

# Semantic Architect V-Lite

Witaj w **Semantic Architect V-Lite** – zaawansowanej aplikacji desktopowej stworzonej dla specjalistów SEO, strategów contentu i marketerów, którzy chcą tworzyć strategie oparte na głębokim zrozumieniu działania wyszukiwarek.

To narzędzie nie jest kolejnym generatorem słów kluczowych. To Twój osobisty **inżynier wiedzy**, który pozwala zdekomponować "konsensus Google" na dowolny temat i przekształcić go w precyzyjną, gotową do wdrożenia mapę tematyczną (Topical Map).

## Spis Treści
1.  [Filozofia i Metodologia](#1-filozofia-i-metodologia-seo-semantycznego)
2.  [Jak Działa Aplikacja? Pełny Proces Analityczny](#2-jak-działa-aplikacja-pełny-proces-analityczny)
3.  [Pierwsze Kroki: Konfiguracja Aplikacji](#3-pierwsze-kroki-konfiguracja-aplikacji)
4.  [Przewodnik Użytkownika: Tworzenie Pierwszej Mapy](#4-przewodnik-użytkownika-tworzenie-pierwszej-mapy)
5.  [Zrozumienie Wyników: Analiza Plików Eksportu](#5-zrozumienie-wyników-analiza-plików-eksportu)
6.  [Od Danych do Działania: Praktyczne Zastosowanie w SEO](#6-od-danych-do-działania-praktyczne-zastosowanie-w-seo)
7.  [Rozwiązywanie Problemów i Dobre Praktyki](#7-rozwiazywanie-problemów-i-dobre-praktyki)

---

### 1. Filozofia i Metodologia: SEO Semantycznego

Aplikacja opiera się na czterech filarach nowoczesnego, semantycznego SEO:

*   **Encje zamiast Słów Kluczowych:** Współczesne wyszukiwarki, takie jak Google, postrzegają świat jako sieć połączonych ze sobą bytów, czyli **encji** (ludzi, miejsc, produktów, koncepcji), a nie jako zbiór słów. Celem jest pokazanie Google, że dogłębnie rozumiemy wszystkie kluczowe encje w naszej niszy oraz relacje między nimi.
*   **"Konsensus Google":** Dla każdego zapytania Google posiada dynamiczny, aktualny obraz tego, jakie strony, tematy i podtematy najlepiej na nie odpowiadają. Ten "konsensus" jest widoczny w czołowych wynikach wyszukiwania (SERP). Aplikacja analizuje ten konsensus, aby zrozumieć, co Google uważa za autorytatywne i ważne *tu i teraz*.
*   **Grafy Wiedzy:** Zebrane informacje są strukturyzowane w postaci **grafu wiedzy** – mapy encji (węzłów) i relacji (krawędzi) między nimi. To pozwala na wizualizację i zrozumienie, jak poszczególne koncepcje łączą się ze sobą, co jest podstawą do budowy logicznej architektury serwisu i linkowania wewnętrznego.
*   **Autorytet Tematyczny (Topical Authority):** Ostatecznym celem jest osiągnięcie przez stronę statusu niekwestionowanego autorytetu w danej dziedzinie. Dzięki kompletnemu pokryciu tematu, logicznej strukturze i precyzyjnemu linkowaniu wewnętrznemu, Google zaczyna postrzegać stronę jako najlepsze i najbardziej wiarygodne źródło informacji, co przekłada się na wyższe i stabilniejsze pozycje.

---

### 2. Jak Działa Aplikacja? Pełny Proces Analityczny

Aplikacja wykonuje złożony, wieloetapowy proces, aby przekształcić jedno zapytanie w kompletną strategię contentową.

1.  **Pozyskiwanie Adresów URL:** W zależności od wybranego trybu, aplikacja:
    *   **Automatycznie:** Wykonuje rozszerzenie zapytania (Query Expansion), a następnie odpytuje SerpData.io dla kilku najważniejszych zapytań, aby zebrać zróżnicowaną listę czołowych adresów URL.
    *   **Manualnie:** Pracuje na liście adresów URL wklejonej bezpośrednio przez użytkownika.
2.  **Pobieranie Treści (Jina AI):** Każdy z zebranych adresów URL jest przetwarzany przez Jina AI w celu pobrania czystej treści strony w formacie Markdown.
3.  **Inteligentne Czyszczenie Treści (MarkdownCleaner):** Surowa treść jest następnie filtrowana. Aplikacja inteligentnie ekstrahuje **tylko te fragmenty, które znajdują się pod nagłówkami H1, H2 i H3**. Mechanizm poprawnie rozpoznaje obie składnie Markdown (Atx: `# H1` oraz Setext: `H1 \n ===`). Ten kluczowy krok eliminuje szum informacyjny ze stopek, menu, paneli bocznych i sekcji cookies.
4.  **Ekstrakcja Grafu Wiedzy:** Oczyszczona treść jest przesyłana do zaawansowanego modelu językowego. Model, wspierany przez precyzyjne instrukcje wykluczające (**negative prompting**), ekstrahuje z treści encje i relacje, tworząc fragment grafu wiedzy.
5.  **Filtrowanie Grafu (GraphCleaner):** Każdy wygenerowany fragment grafu jest następnie przepuszczany przez programowy filtr, który usuwa resztki szumu – encje techniczne (np. `Cookie`), nawigacyjne (np. `Zaloguj się`) i nieistotne z punktu widzenia biznesowego (np. `Amazon`, `Google` jako dostawcy usług).
6.  **Konsolidacja Danych:** Wszystkie **oczyszczone** fragmenty grafów są łączone w jeden, duży, spójny graf wiedzy dla całego analizowanego tematu. Duplikaty węzłów i krawędzi są usuwane.
7.  **Generowanie Raportu Strategicznego:** Finalny, czysty graf jest przesyłany do modelu językowego wraz z kontekstem biznesowym użytkownika. Na tej podstawie AI generuje kompletną mapę tematyczną w formie strategicznego raportu.

---

### 3. Pierwsze Kroki: Konfiguracja Aplikacji

Aby aplikacja działała poprawnie, wymaga jednorazowej konfiguracji kluczy API oraz ustawienia parametrów dla każdego projektu.

#### Klucze API
W sekcji ustawień aplikacji (`Ustawienia API`) należy podać trzy klucze API:
*   **Open Router:** Niezbędny do dostępu do różnych modeli językowych.
*   **Jina AI:** Niezbędny do pobierania treści ze stron.
*   **SerpData.io:** Niezbędny do automatycznej analizy wyników wyszukiwania Google.

Klucze są przechowywane bezpiecznie na Twoim lokalnym komputerze i nie są nigdzie wysyłane.

#### Ustawienia Projektu
Każda analiza wymaga zdefiniowania kluczowych parametrów w panelu konfiguracji.

*   **Centralna Encja / Temat:** Główne pojęcie, wokół którego będzie budowana cała analiza (np. `Endodoncja`, `Implanty zębowe`). Powinno to być szerokie, nadrzędne pojęcie.
*   **Główne zapytanie do Google:** Punkt startowy dla analizy SERP w trybie automatycznym. Zazwyczaj jest to to samo co Centralna Encja, ale może być bardziej szczegółowe (np. `leczenie kanałowe`).
*   **Kontekst Biznesowy:** **NAJWAŻNIEJSZE POLE.** To tutaj instruujesz AI, jak ma interpretować zebrane dane. Zamiast wklejać ogólny tekst "O nas", użyj precyzyjnej, instrukcyjnej struktury, aby uzyskać wyniki skrojone na miarę Twoich potrzeb.

    **Zalecany szablon Kontekstu Biznesowego:**
    ```
    Profil Firmy: Jesteśmy [typ firmy, np. producentem, dystrybutorem, kliniką] [czego, np. instrumentów endodontycznych].
    Grupa Docelowa: Naszymi głównymi klientami są [kto, np. stomatolodzy, endodonci].
    Główny Cel Biznesowy: Chcemy [co osiągnąć, np. zwiększyć sprzedaż, edukować rynek].
    Fokus Analizy: W tej analizie zwróć szczególną uwagę na: [lista priorytetów, np. nazwy konkurencyjnych produktów, procedury medyczne, problemy klientów, porównania technologii].
    ```

---

### 4. Przewodnik Użytkownika: Tworzenie Pierwszej Mapy

1.  **Uruchom aplikację** i przejdź do sekcji ustawień, aby wprowadzić swoje klucze API.
2.  W głównym panelu **wypełnij pola konfiguracyjne projektu**. Poświęć szczególną uwagę na stworzenie precyzyjnego **Kontekstu Biznesowego**.
3.  **Wybierz metodę pozyskiwania URL-i:**
    *   **Automatyczna (zalecane):** Wpisz główne zapytanie i dostosuj suwaki, aby określić głębokość analizy.
    *   **Manualna:** Wklej listę adresów URL, które chcesz przeanalizować.
4.  **Wybierz modele AI:** Z list rozwijanych wybierz modele, których chcesz użyć do ekstrakcji (szybszy i tańszy) oraz syntezy (inteligentniejszy).
5.  Kliknij **"GENERUJ MAPĘ TEMATYCZNĄ"**.
6.  **Obserwuj postęp** w panelu Dziennika Procesu. Analiza może potrwać od kilku do kilkunastu minut, w zależności od liczby analizowanych stron.
7.  Po zakończeniu procesu, w prawym panelu pojawi się **podgląd mapy tematycznej**, a przyciski eksportu staną się aktywne.

---

### 5. Zrozumienie Wyników: Analiza Plików Eksportu

Po zakończeniu analizy aplikacja pozwala na eksport czterech kluczowych plików:

#### `Eksportuj Mapę (Markdown)`
*   **Co to jest?** Twój główny dokument strategiczny, sformatowany w czytelnym pliku Markdown.
*   **Do czego służy?** Do prezentacji strategii klientowi lub zespołowi, a także jako podstawa do planowania architektury serwisu i tworzenia briefów contentowych. Zawiera m.in. klastry tematyczne, pomysły na treści, analizę luk i strategiczne rekomendacje.

#### `Eksportuj Graf (JSON)`
*   **Co to jest?** Surowe, ustrukturyzowane dane w formacie JSON, reprezentujące pełny, oczyszczony graf wiedzy.
*   **Do czego służy?** Dla zaawansowanych analiz, importu do innych narzędzi (np. Neo4j) oraz jako precyzyjna mapa do budowy semantycznego linkowania wewnętrznego. Każda "krawędź" w grafie to potencjalny link wewnętrzny.

#### `Eksportuj Projekt (ZIP)`
*   **Co to jest?** Kompletne archiwum analizy.
*   **Do czego służy?** Do pełnej archiwizacji i dokumentacji projektu. Plik ZIP zawiera mapę w Markdown, graf w JSON oraz plik `metadane.txt` z podsumowaniem ustawień użytych do przeprowadzenia analizy.

#### `Eksportuj Treść (JSON)` (NOWOŚĆ)
*   **Co to jest?** Plik JSON zawierający **wszystkie oczyszczone treści**, które zostały użyte do ekstrakcji grafu wiedzy. Każdy wpis w pliku powiązany jest z oryginalnym adresem URL.
*   **Do czego służy?**
    *   **Weryfikacja:** Pozwala dokładnie sprawdzić, na jakiej podstawie aplikacja zbudowała graf. Zapewnia pełną transparentność procesu.
    *   **Analiza Manualna:** Stanowi bezcenne źródło do manualnego przeglądu treści konkurencji, bez konieczności ponownego odwiedzania każdej strony.

---

### 6. Od Danych do Działania: Praktyczne Zastosowanie w SEO

1.  **Audyt i Planowanie Architektury:** Użyj `mapa_tematyczna.md` do zaprojektowania lub przebudowy struktury serwisu w oparciu o zidentyfikowane klastry tematyczne (strony filarowe i artykuły wspierające).
2.  **Produkcja i Optymalizacja Treści:** Przekształć każdy podtemat z mapy w szczegółowy brief dla copywritera. Wzbogać istniejące treści o brakujące encje i podtematy.
3.  **Budowa Semantycznego Linkowania Wewnętrznego:** Użyj `graf_wiedzy.json` jako precyzyjnej mapy połączeń między Twoimi stronami. Linkuj strony zgodnie z relacjami zidentyfikowanymi w grafie.
4.  **Monitorowanie i Iteracja:** Śledź efekty i powtarzaj analizę co 3-6 miesięcy. Rynek i "konsensus Google" ciągle się zmieniają, a Twoja strategia powinna ewoluować razem z nimi.

---

### 7. Rozwiązywanie Problemów i Dobre Praktyki

*   **Proces trwa bardzo długo:** To normalne. Aplikacja wykonuje dziesiątki, a czasem setki zapytań do zewnętrznych API. Bądź cierpliwy i obserwuj logi postępu.
*   **Otrzymuję błędy API:** Najpierw sprawdź, czy Twoje klucze API są poprawnie wklejone i aktywne. Następnie sprawdź swoje limity użycia w panelach poszczególnych usług.
*   **Wyniki są niskiej jakości:** Najczęstszą przyczyną jest zbyt ogólny **Kontekst Biznesowy**. Wróć do szablonu i stwórz bardziej precyzyjną, instrukcyjną definicję. Rozważ też zmianę źródłowych adresów URL.
*   **Dobra praktyka:** Zawsze zaczynaj od mniejszej liczby URL-i (np. 5-7), aby szybko przetestować konfigurację. Gdy będziesz zadowolony z kierunku, uruchom pełną analizę na większej liczbie stron.
