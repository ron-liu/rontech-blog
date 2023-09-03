---
title: Testing Public and Private Methods in Golang Packages: A Comprehensive Guide
date: "2023-09-03"
---

## Goal and Problem Statement

The goal of this article is to demonstrate how to effectively test both public and private methods in Go. The problem we aim to solve is the confusion arising from package naming conventions when setting up these tests.

## Introduction

Before diving into the specifics, let's get a foundational understanding of what packages mean in the context of Go programming.

## Packages in Go: An Overview

- **What is a Package?**: In Go, a package is a collection of source files that are compiled together.
- **Public and Private Identifiers**: An identifier starting with an uppercase letter is public, while one with a lowercase letter is private.
- **Testing Packages**: For white-box testing to access private methods, use `yourpackage`; for black-box testing to access only public methods, use `yourpackage_test`.

## Let's Use an Example to Demonstrate

To clearly illustrate the concepts, we'll use a Calculator example in the following sections.

## The Calculator Code (`calculator.go`)

```go
// calculator.go in package calculator
package calculator

import (
	"errors"
)

func Add(a, b int) (int, error) {
	if err := validateNumbers(a, b); err != nil {
		return 0, err
	}
	return a + b, nil
}

func validateNumbers(a, b int) error {
	if a < 0 || b < 0 {
		return errors.New("Numbers should be non-negative")
	}
	return nil
}
```

## Testing Public Method: Add() (calculator_test.go)

```go
// calculator_test.go in package calculator_test
package calculator_test

import (
	"testing"
	"calculator"
)

func TestAdd(t *testing.T) {
	sum, err := calculator.Add(1, 2)
	if err != nil {
		t.Errorf("Unexpected error: %s", err)
		return
	}
	if sum != 3 {
		t.Errorf("Expected 3, got %d", sum)
	}
}
```

## Testing Private Method: validateNumbers() (calculator_internal_test.go)

```go
// calculator_internal_test.go in package calculator
package calculator

import (
	"testing"
)

func TestValidateNumbers(t *testing.T) {
	err := validateNumbers(-1, 1)
	if err == nil {
		t.Errorf("Expected error, got nil")
		return
	}
	if err.Error() != "Numbers should be non-negative" {
		t.Errorf("Unexpected error message: %s", err.Error())
	}
}
```

## Key Points

- Public Method (Add): Notice the package calculator_test. This ensures you're only able to test public interfaces.

- Private Method (validateNumbers): The package calculator allows you to access and test private methods.

## Conclusion

Understanding and following package naming conventions in Go is crucial for effectively testing both public and private methods. This article aims to clarify these conventions to remove any confusion.
