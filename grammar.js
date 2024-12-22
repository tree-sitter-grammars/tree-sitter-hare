/**
 * @file Hare grammar for tree-sitter
 * @author Amaan Qureshi <amaanq12@gmail.com>
 * @license MIT
 * @see {@link https://harelang.org|official website}
 * @see {@link https://sr.ht/~sircmpwn/hare|official repository}
 * @see {@link https://harelang.org/specification|official spec}
 */

// deno-lint-ignore-file ban-ts-comment
/* eslint-disable arrow-parens */
/* eslint-disable camelcase */
/* eslint-disable-next-line spaced-comment */
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  PARENTHESES: -1,
  ASSIGNMENT: 0,
  LOGICAL_XOR: 1,
  LOGICAL_OR: 2,
  LOGICAL_AND: 3,
  BITWISE_OR: 4,
  BITWISE_XOR: 5,
  BITWISE_AND: 6,
  EQUALITY: 7,
  COMPARE: 8,
  SHIFT: 9,
  ADD: 10,
  MULTIPLY: 11,
  CAST: 12,
  UNARY: 13,
  CALL: 14,
  MEMBER: 15,
};

const builtin_types = [
  'i8',
  'i16',
  'i32',
  'i64',
  'u8',
  'u16',
  'u32',
  'u64',
  'int',
  'uint',
  'size',
  'uintptr',
  'char',
  'f32',
  'f64',
  'rune',
  'str',
  'bool',
  'void',
];

module.exports = grammar({
  name: 'hare',

  conflicts: $ => [
    // thanks void...
    [$.builtin_type, $.void],
  ],

  extras: $ => [
    $.comment,
    /\s/,
  ],

  supertypes: $ => [
    $.declaration,
    $.expression,
    $.literal,
    $.statement,
    $.type,
  ],

  word: $ => $.identifier,

  rules: {
    module: $ => seq(
      optional($.imports),
      optional($.declarations),
    ),

    imports: $ => repeat1($.use_statement),

    use_statement: $ => seq(
      'use',
      choice(
        seq($.identifier, '=', $.identifier),
        seq(
          choice($.identifier, $.scoped_type_identifier),
          optional(
            seq(
              '::',
              choice(
                seq('{', optionalCommaSep1($.identifier), '}'),
                '*',
              ),
            ),
          )),
      ),
      ';',
    ),

    name_list: $ => optionalCommaSep1($.identifier),

    declarations: $ => repeat1($.declaration),

    declaration: $ => choice(
      $.global_declaration,
      $.constant_declaration,
      $.type_declaration,
      $.function_declaration,
    ),

    global_declaration: $ => seq(
      optional('export'),
      choice('const', 'let'),
      commaSep1($.global_binding),
      ';',
    ),

    global_binding: $ => seq(
      optional($.declaration_attribute),
      $.identifier, ':', $.type, optional(seq('=', $.expression)),
    ),

    declaration_attribute: $ => seq(
      '@symbol', '(', $.string, ')',
    ),

    constant_declaration: $ => seq(
      optional('export'),
      'def',
      commaSep1(seq($.identifier, ':', $.type, '=', $.expression)),
      ';',
    ),

    type_declaration: $ => seq(
      optional('export'),
      'type',
      optionalCommaSep1(seq($.identifier, '=', $.type)),
      ';',
    ),

    function_declaration: $ => seq(
      optional('export'),
      repeat($.function_attribute),
      'fn',
      field('name', $.identifier),
      '(',
      optionalCommaSep($.parameter),
      ')',
      field('returns', optional($.type)),
      optional(seq('=', field('body', $.expression))),
      ';',
    ),

    function_attribute: $ => choice(
      '@fini',
      '@init',
      '@test',
      '@noreturn',
      $.declaration_attribute,
    ),

    parameter: $ => seq(
      choice($.identifier, '_'),
      ':',
      $.type,
      optional('...'),
    ),

    type: $ => choice(
      $.identifier,
      $.scoped_type_identifier,
      $.builtin_type,
      $.pointer_type,
      $.const_type,
      $.error_type,
      $.array_type,
      $.enum_type,
      $.slice_type,
      $.struct_type,
      $.tuple_type,
      $.union_type,
      $.tagged_union_type,
      $.function_type,
      $.unwrapped_type,
    ),

    builtin_type: _ => choice(...builtin_types),

    pointer_type: $ => seq(optional('nullable'), '*', $.type),

    const_type: $ => seq('const', $.type),

    error_type: $ => seq('!', $.type),

    array_type: $ => seq('[', ']', $.type),

    enum_type: $ => seq(
      'enum',
      optional($.builtin_type),
      '{',
      optionalCommaSep1($.enum_field),
      '}',
    ),

    slice_type: $ => seq(
      '[',
      field('size',
        choice('_', '*', $.expression)),
      ']',
      $.type,
    ),

    struct_type: $ => seq(
      'struct',
      optional('@packed'),
      '{',
      optionalCommaSep1($.field),
      '}',
    ),

    tuple_type: $ => seq('(', commaSep($.type), ')'),

    union_type: $ => seq('union', '{', optionalCommaSep1($.field), '}'),

    tagged_union_type: $ => seq('(', $.type, repeat1(seq('|', $.type)), ')'),

    function_type: $ => prec.right(seq(
      optional($.function_attribute),
      'fn',
      '(',
      optionalCommaSep($.parameter),
      ')',
      field('returns', optional($.type)),
    )),

    unwrapped_type: $ => seq('...', $.type),

    enum_field: $ => seq(
      $.identifier,
      optional(seq('=', $.expression)),
    ),

    field: $ => seq(
      optional($.offset_specifier),
      choice(
        seq($.identifier, ':', $.type),
        $.struct_type,
        $.union_type,
        $.identifier,
        $.scoped_type_identifier,
      ),
    ),

    offset_specifier: $ => seq('@offset', '(', $.expression, ')'),

    statement: $ => choice(
      $.break_statement,
      $.defer_statement,
      $.yield_statement,
      $.static_operation,
      $.let_declaration,
      $.const_declaration,
      $.expression_statement,
    ),

    expression_statement: $ => seq($.expression, ';'),

    block: $ => seq(optional($.label), '{', repeat($.statement), '}'),

    if_statement: $ => prec.right(seq(
      'if',
      '(',
      field('condition', $.expression),
      ')',
      field('consequence', $.expression),
      optional($.else_statement),
    )),
    else_statement: $ => prec.right(seq(
      'else',
      field('alternative', $.expression),
    )),

    for_statement: $ => prec.right(seq(
      'for',
      '(',
      optional(seq($.let_expression, ';')),
      seq(
        field('condition', $.expression),
        optional(seq(';', field('afterthought', $.expression))),
      ),
      ')',
      field('body', $.expression),
    )),

    label: $ => seq(':', field('label', $.identifier)),

    break_statement: $ => seq('break', optional($.label), ';'),

    defer_statement: $ => seq('defer', $.statement),

    return_statement: $ => prec.right(seq('return', optional($.expression))),

    yield_statement: $ => seq(
      'yield',
      optional(choice(
        seq($.label, ',', $.expression),
        $.expression,
      )),
      ';',
    ),

    static_operation: $ => seq('static', $.expression, ';'),

    let_declaration: $ => seq(
      optional('static'),
      'let',
      commaSep1(seq(
        choice($.identifier, $.tuple_literal),
        optional(seq(':', $.type)),
        optional(seq('=', $.expression)),
      )),
      ';',
    ),

    const_declaration: $ => seq(
      optional('static'),
      'const',
      commaSep1(seq(
        choice($.identifier, $.tuple_literal),
        optional(seq(':', $.type)),
        '=',
        $.expression,
      )),
      ';',
    ),

    expression: $ => prec.right(choice(
      $.assignment_expression,
      $.update_expression,
      $.unary_expression,
      $.binary_expression,
      $.size_expression,
      $.call_expression,
      $.error_assertion_expression,
      $.cast_expression,
      $.index_expression,
      $.range_expression,
      $.member_expression,
      $.try_expression,
      $.parenthesis_expression,
      $.if_statement,
      $.for_statement,
      $.return_statement,
      $.switch_expression,
      $.match_expression,
      $.block,
      $.identifier,
      $.scoped_type_identifier,

      $.literal,
    )),

    assignment_expression: $ => prec.right(PREC.ASSIGNMENT,
      seq($.expression, '=', $.expression),
    ),

    update_expression: $ => prec.right(PREC.ASSIGNMENT,
      seq(
        $.expression,
        choice(
          '+=',
          '-=',
          '*=',
          '/=',
          '%=',
          '<<=',
          '>>=',
          '|=',
          '&=',
          '^=',
          '||=',
          '&&=',
          '^^=',
        ),
        $.expression,
      ),
    ),

    unary_expression: $ => choice(
      prec.right(PREC.UNARY, seq(
        field('operator', choice('+', '-', '~', '!', '*')),
        field('argument', $.expression),
      )),
      prec.right(PREC.UNARY, seq(
        field('address', '&'),
        field('argument', $.expression),
      )),
    ),

    binary_expression: $ => {
      const table = [
        ['+', PREC.ADD],
        ['-', PREC.ADD],
        ['*', PREC.MULTIPLY],
        ['/', PREC.MULTIPLY],
        ['%', PREC.MULTIPLY],
        ['||', PREC.LOGICAL_OR],
        ['&&', PREC.LOGICAL_AND],
        ['^^', PREC.LOGICAL_XOR],
        ['|', PREC.BITWISE_OR],
        ['&', PREC.BITWISE_AND],
        ['^', PREC.BITWISE_XOR],
        ['==', PREC.EQUALITY],
        ['!=', PREC.EQUALITY],
        ['>', PREC.COMPARE],
        ['>=', PREC.COMPARE],
        ['<=', PREC.COMPARE],
        ['<', PREC.COMPARE],
        ['<<', PREC.SHIFT],
        ['>>', PREC.SHIFT],
      ];

      return choice(...table.map(([operator, precedence]) => {
        return prec.left(precedence, seq(
          field('left', $.expression),
          // @ts-ignore
          field('operator', operator),
          field('right', $.expression),
        ));
      }));
    },

    error_assertion_expression: $ => seq($.expression, '!'),

    cast_expression: $ => prec(PREC.CAST, choice(
      field('type_cast', seq($.expression, ':', $.type)),
      field('as_cast', seq($.expression, 'as', $.type)),
      field('is_cast', seq($.expression, 'is', $.type)),
    )),

    size_expression: $ => seq('size', '(', $.type, ')'),

    call_expression: $ => prec(PREC.CALL, seq(
      field('callee', $.expression),
      '(',
      optionalCommaSep(choice($.expression, $.variadic_argument)),
      ')',
    )),
    variadic_argument: $ => seq($.expression, '...'),

    index_expression: $ => prec(PREC.MEMBER, seq(
      $.expression,
      '[',
      $.expression,
      ']',
    )),

    range_expression: $ => prec(PREC.MEMBER, seq(
      $.expression,
      '[',
      optional($.expression),
      '..',
      optional($.expression),
      ']',
    )),

    member_expression: $ => prec(PREC.MEMBER, seq(
      $.expression,
      '.',
      choice($.identifier, $.number),
    )),

    try_expression: $ => seq($.expression, '?'),

    parenthesis_expression: $ => prec(PREC.PARENTHESES, seq(
      '(',
      $.expression,
      ')',
    )),

    let_expression: $ => seq(
      'let',
      commaSep1(seq(
        $.identifier,
        optional(seq(':', $.type)),
        optional(seq('=', $.expression)),
      )),
    ),

    switch_expression: $ => seq(
      'switch',
      $.expression,
      '{',
      repeat($.case),
      '}',
    ),

    match_expression: $ => seq(
      'match',
      $.expression,
      '{',
      repeat($.case),
      '}',
    ),

    case: $ => seq(
      'case',
      optional(choice(commaSep1($.expression), $.let_expression, $.array_type, $.builtin_type)),
      '=>',
      repeat1($.statement),
    ),

    literal: $ => choice(
      $.array_literal,
      $.struct_literal,
      $.tuple_literal,
      $.number,
      $.float,
      $.string,
      $.raw_string,
      $.concatenated_string,
      $.rune,
      $.boolean,
      $.void,
      $.null,
    ),

    array_literal: $ => prec.right(seq(
      '[',
      optionalCommaSep(seq($.expression, optional('...'))),
      ']',
    )),

    struct_literal: $ => choice(
      seq(
        'struct',
        '{',
        optionalCommaSep1($.field_assignment),
        '}',
      ),
      seq(
        choice($.identifier, $.scoped_type_identifier),
        '{',
        choice(
          seq(
            commaSep1($.field_assignment),
            optional(seq(',', optional('...'))),
          ),
          '...',
        ),
        '}',
      ),
    ),

    field_assignment: $ => choice(
      seq($.identifier, '=', $.expression),
      seq($.identifier, ':', $.type, '=', $.expression),
      $.struct_literal,
    ),

    tuple_literal: $ => seq('(', optionalCommaSep1($.expression), ')'),

    number: $ => {
      const decimal = /0|[1-9][0-9]*/;
      const hex = /0x[0-9a-fA-F][0-9a-fA-F]*/;
      const octal = /0o[0-7][0-7]*/;
      const binary = /0b[01][01]*/;

      const integer = token(choice(
        decimal,
        hex,
        octal,
        binary,
      ));

      const exponent = seq(
        choice('e', 'E'),
        optional(choice('+', '-')),
        /[0-9]+/,
      );

      return choice(
        seq(integer, optional($.integer_suffix)),
        seq(token(seq(decimal, optional(exponent))), optional($.integer_suffix)),
      );
    },

    float: _ => {
      const decimal = /[0-9]+/;
      const exponent = seq(
        choice('e', 'E'),
        optional(choice('+', '-')),
        /[0-9]+/,
      );

      return choice(
        seq(
          token(seq(
            decimal, '.', decimal, optional(exponent),
            optional(choice('f32', 'f64')),
          )),
        ),
        // full token needed here or 10f32 won't parse since 10 will go to int,
        // but 10.0f32 would anyways, and I'd rather not write an external scanner
        token(seq(decimal, optional(exponent), choice('f32', 'f64'))),
      );
    },

    integer_suffix: _ => choice(
      'i',
      'u',
      'z',
      'i8',
      'i16',
      'i32',
      'i64',
      'u8',
      'u16',
      'u32',
      'u64',
    ),

    string: $ => seq(
      '"',
      repeat(choice(
        $.string_content,
        $._escape_sequence,
      )),
      '"',
    ),

    raw_string: $ => seq(
      '`',
      $.raw_string_content,
      '`',
    ),

    concatenated_string: $ => seq($.string, repeat1($.string)),

    string_content: _ => token(prec(1, /[^"\\]+/)),
    raw_string_content: _ => token(prec(1, /[^`]*/)),

    rune: $ => seq(
      '\'',
      choice(
        token.immediate(/[^\']/),
        $._escape_sequence,
      ),
      '\'',
    ),

    _escape_sequence: $ => choice(
      prec(2, token.immediate(seq('\\', /[^abfnrtvxu'"\\?]/))),
      prec(1, $.escape_sequence),
    ),

    escape_sequence: _ => token.immediate(seq(
      '\\',
      choice(
        /[^xu0-7]/,
        /[0-7]{1,3}/,
        /x[0-9a-fA-F]{2}/,
        /u[0-9a-fA-F]{4}/,
        /u\{[0-9a-fA-F]+\}/,
        /U[0-9a-fA-F]{8}/,
      ),
    )),

    boolean: _ => choice('true', 'false'),

    void: _ => 'void',

    null: _ => 'null',

    scoped_type_identifier: $ => seq(
      field('path', choice($.identifier, $.scoped_type_identifier)),
      '::',
      field('name', $.identifier),
    ),

    identifier: _ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    comment: __ => token(seq('//', /(\\(.|\r?\n)|[^\\\n])*/)),
  },
});

module.exports.PREC = PREC;

/**
 * Creates a rule to match optionally match one or more of the rules
 * separated by a comma  and optionally ending with a comma
 *
 * @param {Rule} rule
 *
 * @return {SeqRule}
 *
 */
function optionalCommaSep(rule) {
  return seq(commaSep(rule), optional(','));
}

/**
 * Creates a rule to match one or more of the rules separated by a comma
 * and optionally ending with a comma
 *
 * @param {Rule} rule
 *
 * @return {SeqRule}
 *
 */
function optionalCommaSep1(rule) {
  return seq(commaSep1(rule), optional(','));
}

/**
 * Creates a rule to optionally match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @return {ChoiceRule}
 *
 */
function commaSep(rule) {
  return optional(commaSep1(rule));
}

/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @return {SeqRule}
 *
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
