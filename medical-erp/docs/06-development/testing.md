# Testing Strategy

---
Document ID: DEV-003
Status: Draft
Version: 1.0.0
Owner: Development
Last Update: 2026-07-28
Last Reviewed: 2026-07-28
Source of Truth: true
Depends On: [DEV-001]
---

## 1. Testing Philosophy

Medical ERP follows a **Simplified Testing Pyramid** approach suitable for a small team (1-2 developers).

### 1.1 Testing Pyramid

```
        /\
       /  \  E2E Tests (NOT IMPLEMENTED)
      /----\
     /      \  Integration Tests (some)
    /--------\
   /          \  Unit Tests (many)
  /------------\
```

### 1.2 Strategy Overview

| Level | Scope | Tool | Coverage Target |
|---|---|---|---|
| Unit | Service methods, utilities | JUnit 5 + Mockito | 80% |
| Integration | API endpoints, database | @SpringBootTest | 60% |
| E2E | Full user flows | NOT IMPLEMENTED | N/A |

### 1.3 Why Simplified

| Reason | Explanation |
|---|---|
| Small team | Limited time for testing |
| MVP phase | Focus on features first |
| Low risk | Single-clinic use case |
| Future expansion | Can add E2E later |

---

## 2. Test Types

### 2.1 Unit Tests

**Purpose:** Test individual methods in isolation

**Scope:** Service methods, utilities, mappers

**Tools:** JUnit 5, Mockito

**Coverage Target:** 80%

**Example:**

```java
@ExtendWith(MockitoExtension.class)
class PacienteServiceTest {

    @Mock
    private PacienteRepository pacienteRepository;

    @Mock
    private PacienteMapper pacienteMapper;

    @InjectMocks
    private PacienteService pacienteService;

    @Test
    void should_createPatient_when_validData() {
        // Arrange
        PacienteRequest request = PacienteRequest.builder()
            .apellidoPaterno("García")
            .nombres("María")
            .dni("12345678")
            .build();

        Paciente paciente = Paciente.builder()
            .id(1L)
            .apellidoPaterno("García")
            .nombres("María")
            .dni("12345678")
            .build();

        PacienteResponse response = PacienteResponse.builder()
            .id(1L)
            .apellidoPaterno("García")
            .nombres("María")
            .build();

        when(pacienteMapper.toEntity(request)).thenReturn(paciente);
        when(pacienteRepository.save(paciente)).thenReturn(paciente);
        when(pacienteMapper.toResponse(paciente)).thenReturn(response);

        // Act
        PacienteResponse result = pacienteService.crear(request);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("García", result.getApellidoPaterno());

        verify(pacienteRepository).save(paciente);
    }

    @Test
    void should_throwException_when_dniDuplicate() {
        // Arrange
        PacienteRequest request = PacienteRequest.builder()
            .dni("12345678")
            .build();

        when(pacienteRepository.existsByDni("12345678")).thenReturn(true);

        // Act & Assert
        assertThrows(DuplicateResourceException.class,
            () -> pacienteService.crear(request));
    }
}
```

### 2.2 Integration Tests

**Purpose:** Test multiple components working together

**Scope:** API endpoints, database operations

**Tools:** @SpringBootTest, TestContainers

**Coverage Target:** 60%

**Example:**

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
class PacienteControllerIntegrationTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
        .withDatabaseName("medical_erp_test");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void should_createPatient_when_validRequest() throws Exception {
        // Arrange
        PacienteRequest request = PacienteRequest.builder()
            .apellidoPaterno("García")
            .nombres("María")
            .dni("12345678")
            .build();

        // Act & Assert
        mockMvc.perform(post("/api/v1/pacientes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.id").exists())
            .andExpect(jsonPath("$.data.apellidoPaterno").value("García"));
    }

    @Test
    void should_return400_when_invalidRequest() throws Exception {
        // Arrange
        PacienteRequest request = PacienteRequest.builder()
            .build();  // Missing required fields

        // Act & Assert
        mockMvc.perform(post("/api/v1/pacientes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }
}
```

---

## 3. Test Naming

### 3.1 Method Naming Convention

```
should_{expectedBehavior}_{condition}
```

### 3.2 Examples

| Test Type | Naming Example |
|---|---|
| Success | `should_createPatient_when_validData` |
| Failure | `should_throwException_when_dniDuplicate` |
| Not found | `should_throwException_when_patientNotFound` |
| Validation | `should_return400_when_invalidRequest` |

### 3.3 Test Class Naming

| Class Under Test | Test Class |
|---|---|
| PacienteService | PacienteServiceTest |
| PacienteController | PacienteControllerTest |
| PacienteController (integration) | PacienteControllerIntegrationTest |

---

## 4. Test Data

### 4.1 Test Fixtures

```java
public class TestDataFactory {

    public static PacienteRequest createPacienteRequest() {
        return PacienteRequest.builder()
            .apellidoPaterno("García")
            .apellidoMaterno("López")
            .nombres("María Elena")
            .dni("12345678")
            .tipoDocumento("dni")
            .email("maria@email.com")
            .build();
    }

    public static Paciente createPaciente() {
        return Paciente.builder()
            .id(1L)
            .apellidoPaterno("García")
            .apellidoMaterno("López")
            .nombres("María Elena")
            .dni("12345678")
            .tipoDocumento("dni")
            .email("maria@email.com")
            .estado("activo")
            .build();
    }

    public static Consulta createConsulta() {
        return Consulta.builder()
            .id(1L)
            .historiaId(1L)
            .motivo("Dolor de cabeza")
            .fecha(LocalDateTime.now())
            .build();
    }
}
```

### 4.2 Test Data Cleanup

```java
@BeforeEach
void setUp() {
    // Clean up before each test
    pacienteRepository.deleteAll();
}

@AfterEach
void tearDown() {
    // Clean up after each test
    pacienteRepository.deleteAll();
}
```

### 4.3 Test Data Strategy

| Strategy | Usage |
|---|---|
| In-memory database | Unit tests (H2) |
| TestContainers | Integration tests (MySQL) |
| Mock data | Service tests (Mockito) |

---

## 5. CI Integration

### 5.1 GitHub Actions Workflow

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: medical_erp_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5

    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK 21
        uses: actions/setup-java@v3
        with:
          java-version: '21'
          distribution: 'temurin'

      - name: Cache Maven packages
        uses: actions/cache@v3
        with:
          path: ~/.m2
          key: ${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}
          restore-keys: ${{ runner.os }}-m2

      - name: Run tests
        run: mvn test

      - name: Generate coverage report
        run: mvn jacoco:report

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./target/site/jacoco/jacoco.xml
```

### 5.2 CI Pipeline

| Step | Command | Purpose |
|---|---|---|
| 1 | `mvn clean` | Clean previous builds |
| 2 | `mvn test` | Run all tests |
| 3 | `mvn jacoco:report` | Generate coverage report |
| 4 | `mvn package` | Build JAR (if tests pass) |

### 5.3 CI Rules

| Rule | Description |
|---|---|
| Tests must pass | No merge if tests fail |
| Coverage threshold | 70% minimum |
| No skipped tests | All tests must run |

---

## 6. Coverage Requirements

### 6.1 Coverage Targets

| Type | Target | Enforcement |
|---|---|---|
| Unit Tests | 80% | Recommended |
| Integration Tests | 60% | Recommended |
| Overall | 70% | CI gate |

### 6.2 Coverage Report

```bash
# Generate coverage report
mvn jacoco:report

# View report
open target/site/jacoco/index.html
```

### 6.3 Coverage Rules

| Scenario | Action |
|---|---|
| Coverage below 70% | Warning in CI |
| Coverage below 50% | CI fails |
| New code below 60% | Warning |

---

## 7. Mocking Strategy

### 7.1 When to Mock

| Scenario | Mock? | Reason |
|---|---|---|
| External API calls | Yes | Unreliable, slow |
| Database in unit tests | Yes | Isolation |
| Email service | Yes | Not needed for testing |
| PDF generation | Yes | Slow, complex |
| Time-dependent code | Yes | Deterministic tests |

### 7.2 When NOT to Mock

| Scenario | Mock? | Reason |
|---|---|---|
| Database in integration tests | No | Test real behavior |
| Simple calculations | No | No benefit |
| Value objects | No | Already tested |
| Configuration | No | Already tested |

### 7.3 Mocking Examples

```java
// Mock external service
@Mock
private EmailService emailService;

// Mock repository
@Mock
private PacienteRepository pacienteRepository;

// Mock utility
@Mock
private PdfGenerator pdfGenerator;

// Spy (partial mock)
@Spy
private PacienteMapper pacienteMapper = new PacienteMapperImpl();
```

### 7.4 Mockito Best Practices

| Practice | Example |
|---|---|
| Use `when().thenReturn()` | `when(repo.findById(1L)).thenReturn(Optional.of(paciente))` |
| Use `verify()` | `verify(repo).save(paciente)` |
| Use `ArgumentCaptor` | Capture arguments for verification |
| Avoid over-mocking | Don't mock everything |

---

## 8. Test Execution

### 8.1 Running Tests

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=PacienteServiceTest

# Run specific test method
mvn test -Dtest=PacienteServiceTest#should_createPatient_when_validData

# Run with coverage
mvn test jacoco:report
```

### 8.2 Test Reports

| Report | Location |
|---|---|
| Surefire | `target/surefire-reports/` |
| Jacoco | `target/site/jacoco/` |
| HTML | `target/site/jacoco/index.html` |

---

## Glossary Reference

All domain terms are defined in: DOM-UL-001 (Ubiquitous Language)
