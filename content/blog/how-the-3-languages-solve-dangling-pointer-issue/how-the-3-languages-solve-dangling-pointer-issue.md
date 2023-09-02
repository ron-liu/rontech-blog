---
title: How the 3 languages solve dangling pointer issue
date: "2022-09-02"
---

## The issue

There is a notorious dangling pointer issue in C language like below:

```c
  struct Point {
     int x, y;
  };


  struct Point *getLoc() {
      struct Point pl  {100, 50};
      return &pl;
  }

  int main() {
      struct Point *ptr = getLoc();
      printf("Loc is: %d, %d", ptr->x, ptr->y);
      return 0;
  }
```

The issue happens because in a function we declare a variable, it will allocate memory in the stack. After the function returns, all the stack will be cleared, and the pointer to the allocated variable will be pointed to an invalid address. If we want to read the pointer, a system error might be raised.
This issue will not be caught by the compiler, and even it does not always trigger a system error if the released stack memory is not in use. And that's why it sometimes will not be picked up in the local development environment, and suddenly show up in production.
You also can visit [this online playground](https://cplayground.com/?p=grasshopper-sardine-locust) for the running code. You can see it is not always showing an error because the released stack memory might not be in use.
Basically all the languages after C will have some mechanism to solve this issue. And let's have a look at the following 3 popular languages and see how they solve the issue. The three languages I picked up are JavaScript, Golang, and Rust.

## How JavaScript solve the issue

Firstly, let's have a look the below equivalent JavaScript code.

```ts
type Loc = { x: number; y: number }

function getLoc(): Loc {
  const temp: Loc = { x: 100, y: 50 }
  return temp
}

const ptr = getLoc()
console.log("Loc is:", ptr.x, ptr.y)
```

JavaScript doesn't support pointer, but it doesn't mean it doesn't use pointer. When we pass primitive value, we pass them by value. Other than primitive values, we pass by reference which actually is by pointer. Primitive data type is something like number, boolean, string, etc.
So how JavaScript solve the dangling pointer issue? JavaScript has a rule, if it is not a primitive data type, it will allocate the memory in heap instead of stack. In the above code, because the temp is an object and stored in heap, so we can return it back without destroying it.
JavaScript removes the concept of pointer, and allocate the variable either in stack or heap by its data type. It does solve the dangling pointer issue and it is quite simple, but it doesn't give us options, something like if I just use the struct inside a function, it should be able to just be allocated in stack, but in JavaScript it has to be in heap, it is kind of performance lost.

## How Golang solve the issue

Let's have a look the below equivalent Golang code, and check the online version [here](https://go.dev/play/p/Wy_w62GRStl).

```go
  package main

  import "fmt"

  type Loc struct {
  	x int
  	y int
  }

  func getLoc() *Loc {
  	loc := Loc{x: 1, y: 2}
  	return &loc
  }

  func main() {
  	fmt.Println("Loc is %v", getLoc())
  }
```

The above code run no problem, but why? The `return &loc` is hurting my eyes, why it is allowed?
That's all because `Escape Analysis`, the below is a really good explanation from [this article](https://medium.com/a-journey-with-go/go-introduction-to-the-escape-analysis-f7610174e890).

> The [escape analysis](https://en.wikipedia.org/wiki/Escape_analysis) one of the phases of the Go compiler. It analyses the source code and determines what variables should be allocated on the stack and which ones should escape to the heap.
> So when the go complier noticed the variable is outlive the function scope, it will allocate it to heap, which will be still alive when the function returns. Also notice, it happens when compiling, in another word, it is free.
> Golang's solution is neat, easy, and still give us the option to allocate variable either in stack or heap, and user doesn't to care about it at all, it just automatically happened. If I really want to complain, the only thing I can think of is it is implicit. E.g., I want to allocate it in stack, but I returns the reference which imply the complier it should be allocated in heap, but we don't know. It is a little bit too magic.

## How rust solve the issue?

Let's have a look the below equivalent rust code

```rust
  #[derive(Debug)]
  struct Loc {
      x: i32,
      y: i32,
  }

  fn get_loc() -> &Loc {
      let loc = Loc {x: 1, y: 2};
      &loc
  }

  fn main() {
      let loc = get_loc();
      println!("Loc is: {:?}", loc);
  }
```

The above code looks nice, but it is WRONG, it will complain the below:

```
Compiling playground v0.0.1 (/playground)
error[E0106]: missing lifetime specifier
 --> src/main.rs:7:17
  |
7 | fn get_loc() -> &Loc {
  |                 ^ expected named lifetime parameter
  |
  = help: this function's return type contains a borrowed value, but there is no value for it to be borrowed from
help: consider using the `'static` lifetime
  |
7 | fn get_loc() -> &'static Loc {
  |                 ~~~~~~~~

For more information about this error, try `rustc --explain E0106`.
error: could not compile `playground` due to previous error
```

Rust is a safe language, it didn't allow read a reference which is out of the lifecycle.
The below is the working code. #[derive(Debug)]
struct Loc {
x: i32,
y: i32,
}

fn get_loc() -> Box<Loc> {
Box::new(Loc {x: 1, y: 2})
}

fn main() {
let loc = get_loc();
println!("Loc is: {:}, {:}", loc.x, loc.y);
}
Basically, it uses `Box` which explicitly saying it is allocated in heap, and it is allow to return from a function.

## Summary

The dangling pointer issue is rooted from C language, and all the following language tried to fix the issue. In this article we observed the 3 languages solving it using different concepts.
Javascript solve it by hiding the pointer concept, and the data type determine how it is passed around, either by value or by reference, by stored in stack or stored in heap.
Golang solve it in-explicitly. Based on if the function needs to return the variable or not, the compiler will decide store in stack or heap.
Rust solve it in explicitly strict way. It just disallow dangling pointer by stop compiling. If you want to return a pointer, you have to explicitly store in heap.
