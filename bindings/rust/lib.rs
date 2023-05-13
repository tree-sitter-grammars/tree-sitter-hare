// ------------------------------------------------------------------------------------------------
// Copyright © 2023, Amaan Qureshi <amaanq12@gmail.com>
// See the LICENSE file in this repo for license details.
// ------------------------------------------------------------------------------------------------

//! This crate provides Hare language support for the [tree-sitter][] parsing library.
//!
//! Typically, you will use the [language][language func] function to add this language to a
//! tree-sitter [Parser][], and then use the parser to parse some code:
//!
//! ```
//! let code = "";
//! let mut parser = tree_sitter::Parser::new();
//! parser.set_language(tree_sitter_hare::language()).expect("Error loading Hare grammar");
//! let tree = parser.parse(code, None).unwrap();
//! ```
//!
//! [Language]: https://docs.rs/tree-sitter/*/tree_sitter/struct.Language.html
//! [language func]: fn.language.html
//! [Parser]: https://docs.rs/tree-sitter/*/tree_sitter/struct.Parser.html
//! [tree-sitter]: https://tree-sitter.github.io/

use tree_sitter::Language;

extern "C" {
    fn tree_sitter_hare() -> Language;
}

/// Get the tree-sitter [Language][] for this grammar.
///
/// [Language]: https://docs.rs/tree-sitter/*/tree_sitter/struct.Language.html
pub fn language() -> Language {
    unsafe { tree_sitter_hare() }
}

/// The source of the Rust tree-sitter grammar description.
pub const GRAMMAR: &str = include_str!("../../grammar.js");

/// The folds query for this language.
pub const FOLDS_QUERY: &str = include_str!("../../queries/folds.scm");

/// The syntax highlighting query for this language.
pub const HIGHLIGHTS_QUERY: &str = include_str!("../../queries/highlights.scm");

/// The indents query for this language.
pub const INDENTS_QUERY: &str = include_str!("../../queries/indents.scm");

/// The injection query for this language.
pub const INJECTIONS_QUERY: &str = include_str!("../../queries/injections.scm");

/// The symbol tagging query for this language.
pub const LOCALS_QUERY: &str = include_str!("../../queries/locals.scm");

/// The content of the [`node-types.json`][] file for this grammar.
///
/// [`node-types.json`]: https://tree-sitter.github.io/tree-sitter/using-parsers#static-node-types
pub const NODE_TYPES: &str = include_str!("../../src/node-types.json");

#[cfg(test)]
mod tests {
    #[test]
    fn test_can_load_grammar() {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(super::language())
            .expect("Error loading Hare grammar");
    }

    #[test]
    fn test_some_code() {
        let code = r#"
        // License: MPL-2.0
        // (c) 2021 Bor Grošelj Simić <bor.groseljsimic@telemach.net>
        // (c) 2021 Drew DeVault <sir@cmpwn.com>

        def U: u8 = 0o1;
        def L: u8 = 0o2;
        def N: u8 = 0o4;
        def S: u8 = 0o10;
        def P: u8 = 0o20;
        def C: u8 = 0o40;
        def B: u8 = 0o100;
        def X: u8 = 0o200;

        // LUT of bitfields with character attributes
        const cclass: []u8 = [
        //       0       1       2       3       4       5       6       7
                C,      C,      C,      C,      C,      C,      C,      C,      // 0
                C,      S|C,    S|C,    S|C,    S|C,    S|C,    C,      C,      // 10
                C,      C,      C,      C,      C,      C,      C,      C,      // 20
                C,      C,      C,      C,      C,      C,      C,      C,      // 30
                S|B,    P,      P,      P,      P,      P,      P,      P,      // 40
                P,      P,      P,      P,      P,      P,      P,      P,      // 50
                N|X,    N|X,    N|X,    N|X,    N|X,    N|X,    N|X,    N|X,    // 60
                N|X,    N|X,    P,      P,      P,      P,      P,      P,      // 70
                P,      U|X,    U|X,    U|X,    U|X,    U|X,    U|X,    U,      // 100
                U,      U,      U,      U,      U,      U,      U,      U,      // 110
                U,      U,      U,      U,      U,      U,      U,      U,      // 120
                U,      U,      U,      P,      P,      P,      P,      P,      // 130
                P,      L|X,    L|X,    L|X,    L|X,    L|X,    L|X,    L,      // 140
                L,      L,      L,      L,      L,      L,      L,      L,      // 150
                L,      L,      L,      L,      L,      L,      L,      L,      // 160
                L,      L,      L,      P,      P,      P,      P,      C,      // 170
        ];

        // Returns true if an ASCII character is a letter.
        export fn isalpha(c: rune) bool =
                if (!valid(c)) false else cclass[c: u32] & (U | L) > 0;

        // Returns true if an ASCII character is uppercase.
        export fn isupper(c: rune) bool =
                if (!valid(c)) false else cclass[c: u32] & U > 0;

        // Returns true if an ASCII character is lowercase.
        export fn islower(c: rune) bool =
                if (!valid(c)) false else cclass[c: u32] & L > 0;

        // Returns true if an ASCII character is a digit.
        export fn isdigit(c: rune) bool =
                if (!valid(c)) false else cclass[c: u32] & N > 0;

        // Returns true if an ASCII character is a hexadecimal digit.
        export fn isxdigit(c: rune) bool =
                if (!valid(c)) false else cclass[c: u32] & X > 0;

        // Returns true if an ASCII character is a white-space character -
        // one of '\f', '\n', '\r', '\t', '\v', ' '.
        export fn isspace(c: rune) bool =
                if (!valid(c)) false else cclass[c: u32] & S > 0;

        // Returns true if an ASCII character is punctuation.
        export fn ispunct(c: rune) bool =
                if (!valid(c)) false else cclass[c: u32] & P > 0;

        // Returns true if an ASCII character is alphanumeric.
        export fn isalnum(c: rune) bool =
                if (!valid(c)) false else cclass[c: u32] & (U | L | N) > 0;

        // Returns true if an ASCII character is printable.
        export fn isprint(c: rune) bool =
                if (!valid(c)) false else cclass[c: u32] & (P | U | L | N | B ) > 0;

        // Returns true if an ASCII character is any printable character other than
        // space.
        export fn isgraph(c: rune) bool =
                if (!valid(c)) false else cclass[c: u32] & (P | U | L | N) > 0;

        // Returns true if an ASCII character is a control character.
        export fn iscntrl(c: rune) bool =
                if (!valid(c)) false else cclass[c: u32] & C > 0;

        // Returns true if a rune is a space or a tab.
        export fn isblank(c: rune) bool = (c == ' ' || c == '\t');

        // Returns the uppercase form of an ASCII character, or the original character
        // if it was not a lowercase letter (or was not ASCII).
        export fn toupper(c: rune) rune = {
                return if (islower(c)) {
                        yield (c: u32 - 'a' + 'A'): rune;
                } else c;
        };

        // Returns the lowercase form of an ASCII character, or the original character
        // if it was not an uppercase letter (or was not ASCII).
        export fn tolower(c: rune) rune = {
                return if (isupper(c)) {
                        yield (c: u32 - 'A' + 'a'): rune;
                } else c;
        };

        @test fn ctype() void = {
                // Just some simple tests
                assert(isspace(' ') && !isspace('x') && !isspace('こ'));
                assert(isalnum('a') && isalnum('8') && !isalnum('こ'));
                assert(!ispunct('\0') && iscntrl('\b'));
                assert(tolower('A') == 'a' && tolower('こ') == 'こ');
                assert(isblank(' ') && isblank('\t') && !isblank('6'));
        };   
        "#;

        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(super::language())
            .expect("Error loading Hare grammar");

        parser.parse(code, None).unwrap();
    }
}
