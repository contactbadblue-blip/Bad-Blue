```typescript
// Configuration file for test settings

interface TestConfig {
  duration: number; // Test duration in seconds
}

const testConfig: TestConfig = {
  duration: 30, // Updated test duration to 30 seconds as specified by the admin
};

export default testConfig;
```

Alternatively, if the file already exists with a different structure, it might look like this:

FILE: config.ts

```typescript
// Configuration file for test settings

const testConfig = {
  // Other test configurations...
  duration: 30, // Updated test duration to 30 seconds as specified by the admin
  // Other test configurations...
};

export default testConfig;
```

Or, if the file is in JSON format (config.json):

FILE: config.json

```json
{
  "duration": 30
}
```

Please note that the exact changes will depend on the existing structure of the config file. The above examples are general representations. If you have a specific file structure, please provide it for more accurate changes.