/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */

export declare interface IExpression {
    exprOf(): any;
}

export declare class Operators {
    static Not : string;
    static Mul : string;
    static Div : string;
    static Mod : string;
    static Add : string;
    static Sub : string;
    static Lt : string;
    static Gt : string;
    static Le : string;
    static Ge : string;
    static Eq : string;
    static Ne : string;
    static In : string;
    static NotIn : string;
    static And : string;
    static Or : string;
}

export declare class ArithmeticExpression implements IExpression {
    constructor(left: any, operator: string, right:any);
    exprOf(): any;
}

export declare class MemberExpression implements IExpression {
    constructor(name: string);
    exprOf(): any;
}

export declare class LogicalExpression implements IExpression {
    constructor(operator: string, args: Array<any>);
    exprOf(): any;
}

export declare class LiteralExpression implements IExpression {
    constructor(value: any);
    exprOf(): any;
}

export declare class ComparisonExpression implements IExpression {
    constructor(left: any, operator: string, right:any);
    exprOf(): any;
}

export declare class MethodCallExpression implements IExpression {
    constructor(name: string, args: Array<any>);
    exprOf(): any;
}

export declare function createArithmeticExpression(left: any, operator:string, right: any): ArithmeticExpression;

export declare function createComparisonExpression(left: any, operator:string, right: any): ComparisonExpression;

export declare function createMemberExpression(name: string): MemberExpression;

export declare function createLiteralExpression(value: any): LiteralExpression;

export declare function createMethodCallExpression(name: string, args: Array<any>): MethodCallExpression;

export declare function createLogicalExpression(name: string, args: Array<any>): LogicalExpression;

export declare function isArithmeticExpression(any: any): boolean;

export declare function isArithmeticOperator(op: string): boolean;

export declare function isComparisonOperator(op: string): boolean;

export declare function isLogicalOperator(op: string): boolean;

export declare function isLogicalExpression(any: any): boolean;

export declare function isComparisonExpression(any: any): boolean;

export declare function isMemberExpression(any: any): boolean;

export declare function isLiteralExpression(any: any): boolean;

export declare function isMethodCallExpression(any: any): boolean;


