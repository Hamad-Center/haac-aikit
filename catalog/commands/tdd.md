Implement a feature or fix using test-driven development.

Follow the red-green-refactor loop:

**RED**: Write a failing test that describes the exact behaviour needed.
- Name: `it('should [verb] [noun] when [condition]', ...)`
- Assert on observable output, not internal implementation
- Run it — confirm it fails for the right reason (not a compile error)

**GREEN**: Write the minimal implementation to make the test pass.
- Only enough code to pass the test — no extra features
- Don't modify the test to make it pass

**CHECK**: Run the test suite — confirm the new test passes and nothing else broke.

**REFACTOR**: Clean up without changing behaviour.
- Remove duplication
- Improve naming
- Re-run tests after each change

Done when: all tests pass, no test was modified to accommodate implementation, no production code exists without a covering test.
