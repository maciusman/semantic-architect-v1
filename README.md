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
7.  [Zaawansowane Sterowanie Analizą: Rola i Optymalizacja `Query Expansion`](#7-zaawansowane-sterowanie-analizą-rola-i-optymalizacja-query-expansion)
8.  [Rozwiązywanie Problemów i Dobre Praktyki](#8-rozwiazywanie-problemów-i-dobre-praktyki)

---

### 1. Filozofia i Metodologia: SEO Semantycznego

Aplikacja opiera się na czterech filarach nowoczesnego, semantycznego SEO:

*   **Encje zamiast Słów Kluczowych:** Współczesne wyszukiwarki, takie jak Google, postrzegają świat jako sieć połączonych ze sobą bytów, czyli **encji** (ludzi, miejsc, produktów, koncepcji), a nie jako zbiór słów. Celem jest pokazanie Google, że dogłębnie rozumiemy wszystkie kluczowe encje w naszej niszy oraz relacje między nimi.
*   **"Konsensus Google":** Dla każdego zapytania Google posiada dynamiczny, aktualny obraz tego, jakie strony, tematy i podtematy najlepiej na nie odpowiadają. Ten "konsensus" jest widoczny w czołowych wynikach wyszukiwania (SERP). Aplikacja analizuje ten konsensus, aby zrozumieć, co Google uważa za autorytatywne i ważne *tu i teraz*.
*   **Grafy Wiedzy:** Zebrane informacje są strukturyzowane w postaci **grafu wiedzy** – mapy encji (węzłów) i relacji (krawędzi) między nimi. To pozwala na wizualizację i zrozumienie, jak poszczególne koncepcje łączą się ze sobą, co jest podstawą do budowy logicznej architektury serwisu i linkowania wewnętrznego.
*   **Autorytet Tematyczny (Topical Authority):** Ostatecznym celem jest osiągnięcie przez stronę statusu niekwestionowanego autorytetu w danej dziedzinie. Dzięki kompletnemu pokryciu tematu, logicznej strukturze i precyzyjnemu linkowaniu wewnętrznemu, Google zaczyna postrzegać stronę jako najlepsze i najbardziej wiarygodne źródło informacji, co przekłada się na wyższe i stabilniejsze pozycje.

---

### 2. Jak Działa Aplikacja? Pełny Proces Analityczny

Aplikacja wykonuje złożony, wieloetapowy proces, aby przekształcić jedno zapytanie w kompletną strategię contentową. Nowością jest **inteligentna eksploracja rekursywna** z kontrolą głębokości analizy.

1.  **Pozyskiwanie Adresów URL:** W zależności od wybranego trybu, aplikacja:
    *   **Automatycznie (NOWOŚĆ - Inteligentna Eksploracja):** 
        - Wykonuje zaawansowane **Query Expansion** generując 1-10 hierarchicznych zapytań na podstawie Centralnej Encji
        - Przeprowadza **rekursywną eksplorację SERP** na zadaną głębokość (1-10 dodatkowych rund)
        - W każdej rundzie analizuje sekcje "People Also Ask" i "Related Searches" z Google
        - **Inteligentnie wybiera** najbardziej trafne zapytanie do następnej rundy za pomocą AI
        - Zbiera zróżnicowaną listę czołowych adresów URL z wielu perspektyw tematu
    *   **Manualnie:** Pracuje na liście adresów URL wklejonej bezpośrednio przez użytkownika.
2.  **Pobieranie Treści (Jina AI):** Każdy z zebranych adresów URL jest przetwarzany przez Jina AI w celu pobrania czystej treści strony w formacie Markdown.
3.  **Inteligentne Czyszczenie Treści (MarkdownCleaner):** Surowa treść jest następnie filtrowana. Aplikacja inteligentnie ekstrahuje **tylko te fragmenty, które znajdują się pod nagłówkami H1, H2 i H3**. Mechanizm poprawnie rozpoznaje obie składnie Markdown (Atx: `# H1` oraz Setext: `H1 \n ===`). Ten kluczowy krok eliminuje szum informacyjny ze stopek, menu, paneli bocznych i sekcji cookies.
4.  **Ekstrakcja Grafu Wiedzy:** Oczyszczona treść jest przesyłana do zaawansowanego modelu językowego. Model, wspierany przez precyzyjne instrukcje wykluczające (**negative prompting**), ekstrahuje z treści encje i relacje, tworząc fragment grafu wiedzy.
5.  **Filtrowanie Grafu (GraphCleaner):** Każdy wygenerowany fragment grafu jest następnie przepuszczany przez programowy filtr, który usuwa resztki szumu – encje techniczne (np. `Cookie`), nawigacyjne (np. `Zaloguj się`) i nieistotne z punktu widzenia biznesowego (np. `Amazon`, `Google` jako dostawcy usług).
6.  **Konsolidacja Danych:** Wszystkie **oczyszczone** fragmenty grafów są łączone w jeden, duży, spójny graf wiedzy dla całego analizowanego tematu. Duplikaty węzłów i krawędzi są usuwane.
7.  **Generowanie Raportu Strategicznego:** Finalny, czysty graf jest przesyłany do modelu językowego wraz z kontekstem biznesowym użytkownika. Na tej podstawie AI generuje kompletną mapę tematyczną w formie strategicznego raportu.

#### **NOWOŚĆ: Kontrola Procesu w Czasie Rzeczywistym**
- **Przycisk Zatrzymania:** Możliwość anulowania procesu w dowolnym momencie
- **Punkty Kontrolne:** Aplikacja sprawdza status anulowania na każdym etapie
- **Bezpieczne Zatrzymanie:** Proces zatrzymuje się elegancko, zachowując już przetworzone dane

---

### 3. Pierwsze Kroki: Konfiguracja Aplikacji

Aby aplikacja działała poprawnie, wymaga jednorazowej konfiguracji kluczy API oraz ustawienia parametrów dla każdego projektu.

#### Klucze API
W sekcji ustawień aplikacji (`Ustawienia API`) należy podać trzy klucze API:
*   **Open Router:** Niezbędny do dostępu do różnych modeli językowych.
*   **Jina AI:** Niezbędny do pobierania treści ze stron.
*   **SerpData.io:** Niezbędny do automatycznej analizy wyników wyszukiwania Google.

Klucze są przechowywane bezpiecznie na Twoim lokalnym komputerze i nie są nigdzie wysyłane.

#### Standardowe uruchamianie projektu lokalnie
*   Zainstaluj Node.js (jeśli jeszcze nie masz).
*   Wejdź do folderu projektu w terminalu.
*   Zainstaluj zależności: **npm install**
*   Uruchom aplikację developersko: **npm run dev**

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
5.  **Dostosuj parametry eksploracji:**
    *   **Liczba głównych zapytań (1-10):** Kontroluje szerokość początkowej analizy
    *   **Liczba URL-i na zapytanie (3-10):** Głębokość analizy każdego zapytania
    *   **Liczba dodatkowych eksploracji SERP (1-10):** Ile rund rekursywnej eksploracji ma wykonać
6.  Kliknij **"GENERUJ MAPĘ TEMATYCZNĄ"**.
7.  **W razie potrzeby zatrzymania:** Użyj przycisku **"ZATRZYMAJ PROCES"** który pojawi się podczas przetwarzania.
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

### 7.Zaawansowane Sterowanie Analizą: Rola i Optymalizacja `Query Expansion`

Jednym z głównych mechanizmów w **Semantic Architect V-Lite** jest etap **Query Expansion** oraz **Inteligentna Eksploracja SERP**. To nie jest prosty generator słów kluczowych – to zaawansowany system dwuetapowy, który nadaje kierunek i zakres całej dalszej analizie.

#### Jak Działa Query Expansion i Inteligentna Eksploracja?

**ETAP 1: Query Expansion (Rozszerzanie Zapytań)**
Gdy podajesz **"Centralną Encję"** (np. `Endodoncja`), aplikacja nie analizuje wyników wyszukiwania tylko dla tego jednego hasła. Zamiast tego, uruchamiany jest proces Query Expansion, który:

1.  **Wysyła zapytanie do zaawansowanego modelu AI**, instruując go, aby wcielił się w rolę eksperta SEO i stratega contentu.
2.  Model, bazując na **Centralnej Encji** oraz na Twoim **Kontekście Biznesowym**, generuje **hierarchiczną strukturę zapytań** (1-10 głównych koncepcji z podkategoriami).
3.  Proces ten uwzględnia:
    *   **Różne perspektywy** i aspekty tematu.
    *   **Wariacje intencji użytkownika** (pytania informacyjne, komercyjne, porównawcze).
    *   **Powiązane podtematy** i kategorie.
    *   **Szczegółowe zapytania** typu "długi ogon".

**ETAP 2: Inteligentna Eksploracja SERP (NOWOŚĆ)**
Aplikacja nie zatrzymuje się na zapytaniach z Query Expansion. Uruchamia **rekursywną eksplorację**, która:

1.  **Analizuje sekcje "People Also Ask" i "Related Searches"** w wynikach Google dla każdego zapytania
2.  **Ocenia trafność odkrytych zapytań** używając AI do scoringu relevancji (0.0-1.0)
3.  **Wybiera najbardziej trafne zapytanie** i dodaje je do kolejnej rundy eksploracji
4.  **Powtarza proces** na zadaną głębokość (1-10 dodatkowych rund)

W ten sposób aplikacja prowadzi **inteligentne "dochodzenie"** w temacie, odkrywając coraz bardziej niszowe i wartościowe aspekty.

#### Czy Ten Proces Jest Losowy?

**Nie. Jest to precyzyjnie kontrolowany proces analityczny.** Aplikacja podejmuje **świadome decyzje** o kierunku eksploracji na podstawie:
- Oceny semantycznej trafności zapytań przez AI
- Kontekstu biznesowego podanego przez użytkownika  
- Hierarchicznej struktury generowanych zapytań

#### Jak Kontrolować Wyniki Eksploracji?

Masz do dyspozycji pięć potężnych "dźwigni", które pozwalają precyzyjnie kształtować wyniki eksploracji:

**1. Precyzja `Centralnej Encji / Tematu`**
To Twoje główne narzędzie do określania zakresu.
*   **Szeroka encja (np. `Endodoncja`):** Skutkuje wygenerowaniem ogólnych zapytań, które pokryją całą dziedzinę. Idealne do tworzenia kompleksowych map dla dużych sekcji serwisu.
*   **Wąska encja (np. `Maszynowe pilniki niklowo-tytanowe`):** Spowoduje wygenerowanie bardzo specyficznych zapytań, skupionych na konkretnym produkcie, jego zastosowaniach, porównaniach i problemach użytkowników. Idealne do analizy niszowej.

**2. Jakość `Kontekstu Biznesowego`**
To jest najważniejsze pole do kontrolowania trafności zapytań. Zamiast ogólnego opisu firmy, użyj precyzyjnych, instrukcyjnych dyrektyw.
*   **Przykład słabego kontekstu:** *"Jesteśmy firmą stomatologiczną."* (Wyniki będą ogólne).
*   **Przykład mocnego, instrukcyjnego kontekstu:**
    > *"Profil Firmy: Jesteśmy polskim producentem instrumentów do leczenia kanałowego. Grupa Docelowa: Profesjonalni stomatolodzy. Fokus Analizy: Proszę zwrócić szczególną uwagę na zapytania dotyczące: nazw konkurencyjnych narzędzi, problemów dentystów z procedurami oraz porównań różnych technologii i materiałów."*
    
    Taki kontekst sprawia, że model priorytetowo traktuje zapytania istotne z punktu widzenia **producenta narzędzi**, a nie pacjenta czy studenta.

**3. `Liczba głównych zapytań (1-10)`**
Kontroluje **szerokość** początkowej analizy.
*   **Mniejsza liczba (1-3):** Skoncentrowana analiza wokół kilku głównych koncepcji
*   **Większa liczba (7-10):** Bardzo szeroka analiza pokrywająca wiele aspektów tematu

**4. `Liczba URL-i na zapytanie (3-10)`**
Kontroluje **głębokość** analizy każdego zapytania.
*   **Mniejsza liczba (3-5):** Analiza tylko czołówki wyników Google
*   **Większa liczba (8-10):** Głębsza analiza obejmująca więcej perspektyw dla każdego zapytania

**5. `Liczba dodatkowych eksploracji SERP (1-10)` (NOWOŚĆ)**
Kontroluje **rekursywną głębokość** eksploracji.
*   **Mniejsza liczba (1-2):** Szybka eksploracja najbliższych tematów powiązanych
*   **Większa liczba (5-10):** Głęboka eksploracja prowadząca do odkrycia niszowych, długoogonowych zapytań

**6. Kontrola Procesu w Czasie Rzeczywistym (NOWOŚĆ)**
*   **Przycisk "ZATRZYMAJ PROCES":** Możliwość anulowania w dowolnym momencie
*   **Logi w czasie rzeczywistym:** Pełna transparentność postępu analizy
*   **Punkty kontrolne:** Aplikacja sprawdza status anulowania na każdym etapie

Używając tych narzędzi świadomie, masz pełną kontrolę nad całym procesem eksploracji. Dzięki temu zapewniasz, że cała moc obliczeniowa aplikacji zostanie skierowana na analizę tych aspektów tematu, które są najważniejsze dla osiągnięcia Twoich celów biznesowych.</action>

### 8. Rozwiązywanie Problemów i Dobre Praktyki

*   **Proces trwa bardzo długo:** To normalne. Aplikacja wykonuje dziesiątki, a czasem setki zapytań do zewnętrznych API. Bądź cierpliwy i obserwuj logi postępu.
    - **NOWOŚĆ:** Możesz teraz zatrzymać proces w dowolnym momencie przyciskiem "ZATRZYMAJ PROCES"
    - Zalecane: Testuj najpierw z niższymi parametrami (2-3 główne zapytania, 1-2 eksploracje)
*   **Otrzymuję błędy API:** Najpierw sprawdź, czy Twoje klucze API są poprawnie wklejone i aktywne. Następnie sprawdź swoje limity użycia w panelach poszczególnych usług.
*   **Wyniki są niskiej jakości:** Najczęstszą przyczyną jest zbyt ogólny **Kontekst Biznesowy**. Wróć do szablonu i stwórz bardziej precyzyjną, instrukcyjną definicję. Rozważ też zmianę źródłowych adresów URL.
*   **Eksploracja SERP nie znajduje nowych zapytań:** Sprawdź, czy Twoja "Centralna Encja" jest wystarczająco popularna w Google. Zbyt niszowe tematy mogą nie mieć sekcji "People Also Ask" lub "Related Searches".
*   **Proces się zatrzymuje przedwcześnie:** Aplikacja automatycznie kończy eksplorację, gdy nie znajduje nowych, trafnych zapytań (wynik relevancji < 0.3). To normalne zachowanie chroniące przed analizą nierelewantnych treści.
*   **Dobre praktyki startowe:** 
    - Zacznij z parametrami: 2-3 główne zapytania, 5 URL-i na zapytanie, 1-2 eksploracje SERP
    - Gdy będziesz zadowolony z kierunku, zwiększ parametry dla pełnej analizy
    - Monitoruj logi w czasie rzeczywistym, aby zrozumieć jak przebiega proces</action>

**🔗 Opis narzędzia na moim blogu**: https://aiposition.pl/blog/aplikacje/jak-przestac-zgadywac-w-seo-semantic-architect-moje-narzedzie-do-mapowania-semantyki-i-intencji

**🔗 Skontaktuj się ze mną na LinkedIn**: https://www.linkedin.com/in/walczuk-maciej/
