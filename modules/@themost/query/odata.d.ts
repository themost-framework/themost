/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {defaultCipherList} from "constants";
import {MemberExpression, MethodCallExpression} from "./expressions";

export declare interface TokenType {
    Literal : string;
    Identifier: string;
    Syntax: string;
}

export declare interface OperatorType {
    Not: string;
    Mul: string;
    Div: string;
    Mod: string;
    Add: string;
    Sub: string;
    Lt: string;
    Gt: string;
    Le: string;
    Ge: string;
    Eq: string;
    Ne: string;
    In: string;
    NotIn: string;
    And: string;
    Or: string;
}

export declare class Token {
    constructor(tokenType: string);
    
    static TokenType: TokenType;
    static Operator: OperatorType;
    
    isParenOpen(): boolean;
    isParenClose(): boolean;
    isSlash(): boolean;
    isComma(): boolean;
    isNegative(): boolean;

}

export declare interface LiteralType {
    Null: string;
    String: string;
    Boolean: string;
    Single: string;
    Double: string;
    Decimal: string;
    Int: string;
    Long: string;
    Binary: string;
    DateTime: string;
    Guid: string;
    Duration: string;
}

export declare interface StringType {
    None: string;
    Binary: string;
    DateTime: string;
    Guid: string;
    Time: string;
    DateTimeOffset: string;
}

export declare class LiteralToken extends Token {
    constructor(value: string, literalType: string);
    static PositiveInfinity : LiteralToken;
    static NegativeInfinity : LiteralToken;
    static NaN : LiteralToken;
    static True : LiteralToken;
    static False : LiteralToken;
    static Null : LiteralToken;
    
}

export declare class IdentifierToken extends Token {
    constructor(name: string);
    identifier: string;
    
}

export declare class SyntaxToken extends Token {
    constructor(chr: string);
    syntax: string;
    static ParenOpen : SyntaxToken; 
    static ParenClose : SyntaxToken; 
    static Slash : SyntaxToken; 
    static Comma : SyntaxToken; 
    static Negative : SyntaxToken; 
}

export declare class OpenDataParser {
    constructor();
    static create(): OpenDataParser;
    static isChar(c: any): boolean;
    static isDigit(c: any): boolean;
    static isIdentifierStartChar(c: any): boolean;
    static isWhitespace(c: any): boolean;
    static isIdentifierChar(c: any): boolean;
    static isDigit(c: any): boolean;

    parse(str: string, callback: (err?: Error, res?: any) => void);
    getOperator(token: string): string;
    moveNext();
    expect();
    expectAny();
    atEnd();
    atStart();
    parseCommon(callback: (err?: Error, res?: any) => void);
    parseCommonItem(callback: (err?: Error, res?: any) => void);
    createExpression(left: any,operator: string, right: any): any;
    parseMethodCall(callback: (err?: Error, res?: MethodCallExpression) => void);
    parseMethodCallArguments(args: Array<any>, callback: (err?: Error, res?: any) => void);
    parseMember(callback: (err?: Error, res?: MemberExpression) => void);
    resolveMember(member: any, callback: (err?: Error, res?: any) => void);
    resolveMethod(method: any, args: Array<any>, callback: (err?: Error, res?: any) => void);
    toList():Array<Token>;
    getNext(): Token;
    parseSyntax(): SyntaxToken;
    parseIdentifier(minus?: boolean): Token;
    parseGuidString(value: string): LiteralToken;
    parseTimeString(value: string): LiteralToken;
    parseBinaryString(value: string): LiteralToken;
    parseDateTimeString(value: string): LiteralToken;
    parseDateTimeOffsetString(value: string): LiteralToken;
    parseSpecialString(value: string, stringType: string): any;
    parseString(): LiteralToken;
    skipDigits(current: any);
    parseNumeric(): LiteralToken;
    parseSign(): Token;


}