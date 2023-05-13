# tree-sitter-hare

This crate provides a Hare grammar for the [tree-sitter][] parsing library. To
use this crate, add it to the `[dependencies]` section of your `Cargo.toml`
file. (Note that you will probably also need to depend on the
[`tree-sitter`][tree-sitter crate] crate to use the parsed result in any useful
way.)

```toml
[dependencies]
tree-sitter = "~0.20.10"
tree-sitter-hare = "1.0.0"
```

Typically, you will use the [language][language func] function to add this
grammar to a tree-sitter [Parser][], and then use the parser to parse some code:

```rust
let code = r#"
export fn open_file(fs: *fs, path: str, flags: flags...) (io::file | error) = {
    match (fs.openfile) {
    case null =>
        return errors::unsupported;
    case let f: *openfilefunc =>
        return f(fs, path, flags...);
    };
};
"#;
let mut parser = Parser::new();
parser.set_language(tree_sitter_hare::language()).expect("Error loading Hare grammar");
let parsed = parser.parse(code, None);
```

If you have any questions, please reach out to us in the [tree-sitter
discussions] page.

[language func]: https://docs.rs/tree-sitter-hare/*/tree_sitter_hare/fn.language.html
[parser]: https://docs.rs/tree-sitter/*/tree_sitter/struct.Parser.html
[tree-sitter]: https://tree-sitter.github.io/
[tree-sitter crate]: https://crates.io/crates/tree-sitter
[tree-sitter discussions]: https://github.com/tree-sitter/tree-sitter/discussions
