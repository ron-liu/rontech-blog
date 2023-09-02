---
title: What canonical http header mean in Golang
date: "2022-09-09"
---

When you try to manipulate headers inside `http.Request`, you will find it always change the case. More specific, when you set the header normally like `r.Header.Set("request-id", "12345")`, you will expect it will set a header with key equals to `request-id`, and the value is `12345`. However, the key actually becomes `Request-Id`.
Pretty weird, isn't it?
Yes, this case format is called `Canonical Form`, which means each word separated by a hyphen is capitalised. i.e., `request-id` becomes `Request-Id`, `accepted-verb` becomes `Accepted-Verb`.
I couldn't find any standard saying `Canonical form` in http header, it looks like it is unique for Golang http package. Correct me if I was wrong, thank you!

## What will happen when we set the header?

No matter we use the `Set` or `Get` method in `Header`, it will firstly **canonicalise** the key. Take a look the below http source code:

```go
// Add adds the key, value pair to the header.
// It appends to any existing values associated with key.
func (h MIMEHeader) Add(key, value string) {
	key = CanonicalMIMEHeaderKey(key)
	h[key] = append(h[key], value)
}

// Set sets the header entries associated with key to
// the single element value. It replaces any existing
// values associated with key.
func (h MIMEHeader) Set(key, value string) {
	h[CanonicalMIMEHeaderKey(key)] = []string{value}
}
```

The method `CanonicalMIMEHeaderKey` is to canonicalise.

## How about if I don't want to canonicalise the key when set header?

In the document it said:

> To use non-canonical keys, assign to the map directly.
> It means if you want to set `request-id` to be `12345`, you can write the below code:

```go
r.Header['request-id'] = []string{"12345"}
```

The Header's type actually is `map[string][]string`, meaning it is a `map`, and its key type is `string` and its value type is `[]string`. And that's why we we assign to the map directly, we need to set the value as string array.

## What happen when we read the header?

For example, when we are using some http server package like `mux` or `gin`, in the request handler, when we read the request header, what will it happen?
Unfortunately, the http package will canonicalise the header key. It means if the request header is `request-id: 12345`, the key in the request http.Request is `Request-Id`.
The good news is that you still can use the low case key to get the right value back, which means:

```go
r.Request.Get("request-id") // it will return 12345
r.Request.Get("Request-Id") // it will return 12345 too
```

Check the http package source code below, you will find why:

```go
// Get gets the first value associated with the given key.
// It is case insensitive; CanonicalMIMEHeaderKey is used
// to canonicalize the provided key.
// If there are no values associated with the key, Get returns "".
// To use non-canonical keys, access the map directly.
func (h MIMEHeader) Get(key string) string {
	if h == nil {
		return ""
	}
	v := h[CanonicalMIMEHeaderKey(key)]
	if len(v) == 0 {
		return ""
	}
	return v[0]
}
```

It will canonicalise the key before read from the internal map.

## Summary

In Golang, the header in http.Request is key canonicalised by default.
If you want to set the non-canonicalised key in header, you can directly assign to the map.
When you want to read the request using golang http server framework, the key is also canonicalised, but you still can use non-canonicalised key to get.
