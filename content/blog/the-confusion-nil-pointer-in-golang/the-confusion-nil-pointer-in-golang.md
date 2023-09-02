---
title: The confusion nil pointer in golang
date: "2023-02-26"
---

When I firstly learn golang, I think `nil` is just like `undefined` in javascript. It just means it point to nothing.
If you think the same way, let's check the following puzzles.

### Can I assign a untyped nil directly to a variable?

```go
  nilPointer := nil  // <-golang compile error: use of untyped nil in assignment
```

So the answer is NO, you cannot.

### Does typed nil equals to untyped nil?

```go
  var dogPointer *Dog = nil
  fmt.Println("Does (*Dog)nil equal to untyped nil?", dogPointer == nil)  // Does (*Dog)nil equal to untyped nil? true
```

Yes, as you expect

### But dees interface{} nil pointing to typed nil equal to untyped nil?

```go
	var dogPointer *Dog = nil
	pointer = dogPointer
	fmt.Println("Dees untyped nil pointing to  equal to (*Dog)nil ?", pointer == nil) // Does (*Dog)nil equal to untyped nil? true
```

Oh, no, that's wired. Why???

### OK, Does interface{} nil equal to untyped nil ?

```go
var pointer interface{} = nil
fmt.Println("Does interface{} nil equal to untyped nil ?", pointer == nil) // Does interface{} nil equal to untyped nil ? true
```

The answer is Yes, I think it makes sense

### And that's why we can use `err == nil` ?

```go
func call() error {
    return nil
}
if call() == nil {
    // ...
}
```

`error` is a interface, and that's why we can compare with a untyped nil.

### How about other interface assigned as nil equals to untyped nil?

```go
type Animal interface{}
var animal Animal = nil
fmt.Println("Does a normal interface nil equal to untyped nil?", animal == nil)  // Does a normal interface nil equal to untyped nil? true
```

Oh, interface null is actually untyped nil, emm, makes sense.

### Can a typed nil call member function?

```go
type Dog struct{}
func (dog *Dog) Bark() {
	fmt.Println("Dog is barking")
}
var dogPointer Dog = nil
dogPointer.Bark()  // Dog is barking
```

The answer is YES, yeah!
What will happen if I want to cast a interface {} nil to a type?

```go
    var pointer interface{} = nil
	aPointer, ok := pointer.(*Dog)
	fmt.Println("Hello", aPointer, ok) // Hello <nil> false
```

Yeah, it will fail, makes sense
What will happen if I want to cast a typed nil to the type?

```go
	pointer = dogPointer
	aPointer, ok = pointer.(*Dog)
	fmt.Println("Hello", aPointer, ok) // Hello <nil> true
```

Are you confused ? I am not sure, but I am haha!
