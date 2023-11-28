import { SourceGenerator } from './source-gen.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as lua from '@meepen/luaparse';

describe('SourceGenerator', () => {
  it('should exist', () => {
    assert(SourceGenerator);
  });

  describe('generate', () => {
    describe('FunctionStatement', () => {
      it('should generate a simple function', async () => {
        const generator = new SourceGenerator(
          new lua.FunctionStatement(
            new lua.FuncName(new lua.Name('test'), []),
            new lua.FuncBody(new lua.ParameterList(new lua.NameList([]), false), new lua.Chunk([])),
          ),
        );

        assert.strictEqual(await generator.generate(), 'function test()\nend');
      });
      it('should generate a simple function with a parameter', async () => {
        const generator = new SourceGenerator(
          new lua.FunctionStatement(
            new lua.FuncName(new lua.Name('test'), []),
            new lua.FuncBody(new lua.ParameterList(new lua.NameList([new lua.Name('a')]), false), new lua.Chunk([])),
          ),
        );

        assert.strictEqual(await generator.generate(), 'function test(a)\nend');
      });
      it('should generate a simple function with a vararg', async () => {
        const generator = new SourceGenerator(
          new lua.FunctionStatement(
            new lua.FuncName(new lua.Name('test'), []),
            new lua.FuncBody(new lua.ParameterList(new lua.NameList([]), true), new lua.Chunk([])),
          ),
        );

        assert.strictEqual(await generator.generate(), 'function test(...)\nend');
      });
      it('should generate a simple function with a parameter and a vararg', async () => {
        const generator = new SourceGenerator(
          new lua.FunctionStatement(
            new lua.FuncName(new lua.Name('test'), []),
            new lua.FuncBody(new lua.ParameterList(new lua.NameList([new lua.Name('a')]), true), new lua.Chunk([])),
          ),
        );

        assert.strictEqual(await generator.generate(), 'function test(a, ...)\nend');
      });
    });

    describe('IfStatement', () => {
      it('should generate a simple if statement', async () => {
        const generator = new SourceGenerator(
          new lua.IfStatement(new lua.TrueExpression(), new lua.Chunk([new lua.BreakStatement()]), []),
        );

        assert.strictEqual(await generator.generate(), 'if true then\n  break\nend');
      });
      it('should generate a simple if statement with an else clause', async () => {
        const generator = new SourceGenerator(
          new lua.IfStatement(
            new lua.TrueExpression(),
            new lua.Chunk([new lua.BreakStatement()]),
            [],
            new lua.Chunk([new lua.BreakStatement()]),
          ),
        );

        assert.strictEqual(await generator.generate(), 'if true then\n  break\nelse\n  break\nend');
      });
      it('should generate a simple if statement with an elseif clause', async () => {
        const generator = new SourceGenerator(
          new lua.IfStatement(new lua.TrueExpression(), new lua.Chunk([new lua.BreakStatement()]), [
            new lua.ElseIfClause(new lua.TrueExpression(), new lua.Chunk([new lua.BreakStatement()])),
          ]),
        );

        assert.strictEqual(await generator.generate(), 'if true then\n  break\nelseif true then\n  break\nend');
      });
      it('should generate a simple if statement with an elseif clause and an else clause', async () => {
        const generator = new SourceGenerator(
          new lua.IfStatement(
            new lua.TrueExpression(),
            new lua.Chunk([new lua.BreakStatement()]),
            [new lua.ElseIfClause(new lua.TrueExpression(), new lua.Chunk([new lua.BreakStatement()]))],
            new lua.Chunk([new lua.BreakStatement()]),
          ),
        );

        assert.strictEqual(
          await generator.generate(),
          'if true then\n  break\nelseif true then\n  break\nelse\n  break\nend',
        );
      });
    });

    describe('LocalFunctionStatement', () => {
      it('should generate a simple local function', async () => {
        const generator = new SourceGenerator(
          new lua.LocalFunctionStatement(
            new lua.Name('test'),
            new lua.FuncBody(new lua.ParameterList(new lua.NameList([]), false), new lua.Chunk([])),
          ),
        );

        assert.strictEqual(await generator.generate(), 'local function test()\nend');
      });
      it('should generate a simple local function with a parameter', async () => {
        const generator = new SourceGenerator(
          new lua.LocalFunctionStatement(
            new lua.Name('test'),
            new lua.FuncBody(new lua.ParameterList(new lua.NameList([new lua.Name('a')]), false), new lua.Chunk([])),
          ),
        );

        assert.strictEqual(await generator.generate(), 'local function test(a)\nend');
      });
      it('should generate a simple local function with a vararg', async () => {
        const generator = new SourceGenerator(
          new lua.LocalFunctionStatement(
            new lua.Name('test'),
            new lua.FuncBody(new lua.ParameterList(new lua.NameList([]), true), new lua.Chunk([])),
          ),
        );

        assert.strictEqual(await generator.generate(), 'local function test(...)\nend');
      });
      it('should generate a simple local function with a parameter and a vararg', async () => {
        const generator = new SourceGenerator(
          new lua.LocalFunctionStatement(
            new lua.Name('test'),
            new lua.FuncBody(new lua.ParameterList(new lua.NameList([new lua.Name('a')]), true), new lua.Chunk([])),
          ),
        );

        assert.strictEqual(await generator.generate(), 'local function test(a, ...)\nend');
      });
    });

    describe('LocalStatement', () => {
      it('should generate a simple local statement', async () => {
        const generator = new SourceGenerator(
          new lua.LocalVariablesStatement(new lua.NameList([new lua.Name('test')])),
        );

        assert.strictEqual(await generator.generate(), 'local test');
      });

      it('should generate a simple local statement with an assignment', async () => {
        const generator = new SourceGenerator(
          new lua.LocalVariablesStatement(
            new lua.NameList([new lua.Name('test')]),
            new lua.ExpressionList([new lua.TrueExpression()]),
          ),
        );

        assert.strictEqual(await generator.generate(), 'local test = true');
      });

      it('should generate a simple local statement with multiple assignments', async () => {
        const generator = new SourceGenerator(
          new lua.LocalVariablesStatement(
            new lua.NameList([new lua.Name('test'), new lua.Name('test2')]),
            new lua.ExpressionList([new lua.TrueExpression(), new lua.FalseExpression()]),
          ),
        );

        assert.strictEqual(await generator.generate(), 'local test, test2 = true, false');
      });

      it('should generate a simple local statement with mismatched counts', async () => {
        const generator = new SourceGenerator(
          new lua.LocalVariablesStatement(
            new lua.NameList([new lua.Name('test'), new lua.Name('test2')]),
            new lua.ExpressionList([new lua.TrueExpression()]),
          ),
        );

        assert.strictEqual(await generator.generate(), 'local test, test2 = true');
      });
    });

    describe('RepeatStatement', () => {
      it('should generate a simple repeat statement', async () => {
        const generator = new SourceGenerator(
          new lua.RepeatStatement(new lua.Chunk([new lua.BreakStatement()]), new lua.TrueExpression()),
        );

        assert.strictEqual(await generator.generate(), 'repeat\n  break\nuntil true');
      });
    });

    describe('ReturnStatement', () => {
      it('should generate a simple return statement', async () => {
        const generator = new SourceGenerator(new lua.ReturnStatement(new lua.ExpressionList([])));

        assert.strictEqual(await generator.generate(), 'return');
      });

      it('should generate a simple return statement with an expression', async () => {
        const generator = new SourceGenerator(
          new lua.ReturnStatement(new lua.ExpressionList([new lua.TrueExpression()])),
        );

        assert.strictEqual(await generator.generate(), 'return true');
      });
    });

    describe('WhileStatement', () => {
      it('should generate a simple while statement', async () => {
        const generator = new SourceGenerator(
          new lua.WhileStatement(new lua.TrueExpression(), new lua.Chunk([new lua.BreakStatement()])),
        );

        assert.strictEqual(await generator.generate(), 'while true do\n  break\nend');
      });
    });

    describe('BreakStatement', () => {
      it('should generate a simple break statement', async () => {
        const generator = new SourceGenerator(new lua.BreakStatement());

        assert.strictEqual(await generator.generate(), 'break');
      });
    });

    describe('CallStatement', () => {
      it('should generate a simple call statement', async () => {
        const generator = new SourceGenerator(
          new lua.FunctionCallStatement(
            new lua.NormalFunctionCall(
              new lua.NameVariable(new lua.Name('test')),
              new lua.ExpressionListArguments(new lua.ExpressionList([])),
            ),
          ),
        );

        assert.strictEqual(await generator.generate(), 'test()');
      });
    });

    describe('ForStatement', () => {
      it('should generate a simple for do block', async () => {
        const generator = new SourceGenerator(
          new lua.ForStatement(
            new lua.Name('i'),
            new lua.Chunk([new lua.BreakStatement()]),
            new lua.NumberExpression('1', 1),
            new lua.NumberExpression('10', 10),
            new lua.NumberExpression('1', 1),
          ),
        );

        assert.strictEqual(await generator.generate(), 'for i = 1, 10, 1 do\n  break\nend');
      });
    });

    describe('AssignmentStatement', () => {
      it('should generate a simple assignment statement', async () => {
        const generator = new SourceGenerator(
          new lua.AssignmentStatement(
            new lua.VariableList([new lua.NameVariable(new lua.Name('test'))]),
            new lua.ExpressionList([new lua.TrueExpression()]),
          ),
        );

        assert.strictEqual(await generator.generate(), 'test = true');
      });
      it('should generate a simple assignment statement with multiple variables', async () => {
        const generator = new SourceGenerator(
          new lua.AssignmentStatement(
            new lua.VariableList([
              new lua.NameVariable(new lua.Name('test')),
              new lua.NameVariable(new lua.Name('test2')),
            ]),
            new lua.ExpressionList([new lua.TrueExpression(), new lua.FalseExpression()]),
          ),
        );

        assert.strictEqual(await generator.generate(), 'test, test2 = true, false');
      });
      it('should generate a simple assignment statement with mismatched counts', async () => {
        const generator = new SourceGenerator(
          new lua.AssignmentStatement(
            new lua.VariableList([
              new lua.NameVariable(new lua.Name('test')),
              new lua.NameVariable(new lua.Name('test2')),
            ]),
            new lua.ExpressionList([new lua.TrueExpression()]),
          ),
        );

        assert.strictEqual(await generator.generate(), 'test, test2 = true');
      });
    });

    describe('DoStatement', () => {
      it('should generate a simple do block', async () => {
        const generator = new SourceGenerator(new lua.DoStatement(new lua.Chunk([new lua.BreakStatement()])));

        assert.strictEqual(await generator.generate(), 'do\n  break\nend');
      });
    });

    describe('ForInStatement', () => {
      it('should generate a simple for in block', async () => {
        const generator = new SourceGenerator(
          new lua.ForInStatement(
            new lua.NameList([new lua.Name('i')]),
            new lua.ExpressionList([new lua.TrueExpression()]),
            new lua.Chunk([new lua.BreakStatement()]),
          ),
        );

        assert.strictEqual(await generator.generate(), 'for i in true do\n  break\nend');
      });

      it('should generate a simple for in block with multiple variables', async () => {
        const generator = new SourceGenerator(
          new lua.ForInStatement(
            new lua.NameList([new lua.Name('i'), new lua.Name('j')]),
            new lua.ExpressionList([new lua.TrueExpression()]),
            new lua.Chunk([new lua.BreakStatement()]),
          ),
        );

        assert.strictEqual(await generator.generate(), 'for i, j in true do\n  break\nend');
      });

      it('should generate a simple for in block with multiple expressions', async () => {
        const generator = new SourceGenerator(
          new lua.ForInStatement(
            new lua.NameList([new lua.Name('i')]),
            new lua.ExpressionList([new lua.TrueExpression(), new lua.FalseExpression()]),
            new lua.Chunk([new lua.BreakStatement()]),
          ),
        );

        assert.strictEqual(await generator.generate(), 'for i in true, false do\n  break\nend');
      });
    });

    describe('FunctionName', () => {
      it('should generate a simple function name', async () => {
        const generator = new SourceGenerator(new lua.FuncName(new lua.Name('test'), []));

        assert.strictEqual(await generator.generate(), 'test');
      });
      it('should generate a simple function name with an indexer', async () => {
        const generator = new SourceGenerator(new lua.FuncName(new lua.Name('test'), [new lua.Name('test')]));

        assert.strictEqual(await generator.generate(), 'test.test');
      });
      it('should generate a simple function name with an indexer and a member', async () => {
        const generator = new SourceGenerator(
          new lua.FuncName(new lua.Name('test'), [new lua.Name('test')], new lua.Name('test2')),
        );

        assert.strictEqual(await generator.generate(), 'test.test:test2');
      });
    });

    describe('Arguments', () => {
      it('should generate a simple expression list arguments', async () => {
        const generator = new SourceGenerator(
          new lua.ExpressionListArguments(new lua.ExpressionList([new lua.TrueExpression()])),
        );

        assert.strictEqual(await generator.generate(), '(true)');
      });
      it('should generate a simple table constructor arguments', async () => {
        const generator = new SourceGenerator(
          new lua.TableConstructorArguments(
            new lua.TableConstructorExpression([new lua.FieldArrayKey(new lua.TrueExpression())]),
          ),
        );

        assert.strictEqual(await generator.generate(), '{\n  true,\n}');
      });
      it('should generate a simple string arguments', async () => {
        const generator = new SourceGenerator(new lua.StringArguments(new lua.StringExpression('"test"', 'test')));

        assert.strictEqual(await generator.generate(), '"test"');
      });
    });

    describe('ElseIfClause', () => {
      it('should generate a simple elseif clause', async () => {
        const generator = new SourceGenerator(
          new lua.ElseIfClause(new lua.TrueExpression(), new lua.Chunk([new lua.BreakStatement()])),
        );

        assert.strictEqual(await generator.generate(), 'elseif true then\n  break');
      });
    });

    describe('Field', () => {
      it('should generate a simple field array key', async () => {
        const generator = new SourceGenerator(new lua.FieldArrayKey(new lua.TrueExpression()));

        assert.strictEqual(await generator.generate(), 'true');
      });

      it('should generate a simple field name key', async () => {
        const generator = new SourceGenerator(new lua.FieldNameKey(new lua.Name('test'), new lua.TrueExpression()));

        assert.strictEqual(await generator.generate(), 'test = true');
      });

      it('should generate a simple field expression key', async () => {
        const generator = new SourceGenerator(
          new lua.FieldExpressionKey(new lua.TrueExpression(), new lua.TrueExpression()),
        );

        assert.strictEqual(await generator.generate(), '[true] = true');
      });
    });
  });

  describe('generateExpression', () => {
    it('should generate a nil expression', async () => {
      const generator = new SourceGenerator(new lua.NilExpression());

      assert.strictEqual(await generator.generate(), 'nil');
    });
    it('should generate a false expression', async () => {
      const generator = new SourceGenerator(new lua.FalseExpression());

      assert.strictEqual(await generator.generate(), 'false');
    });
    it('should generate a true expression', async () => {
      const generator = new SourceGenerator(new lua.TrueExpression());

      assert.strictEqual(await generator.generate(), 'true');
    });
    it('should generate a number expression', async () => {
      const generator = new SourceGenerator(new lua.NumberExpression('1', 1));

      assert.strictEqual(await generator.generate(), '1');
    });
    it('should generate a string expression', async () => {
      const generator = new SourceGenerator(new lua.StringExpression('"test"', 'test'));

      assert.strictEqual(await generator.generate(), '"test"');
    });
    it('should generate a vararg expression', async () => {
      const generator = new SourceGenerator(new lua.VarargExpression());

      assert.strictEqual(await generator.generate(), '...');
    });
    it('should generate a function expression', async () => {
      const generator = new SourceGenerator(
        new lua.FunctionExpression(
          new lua.FuncBody(new lua.ParameterList(new lua.NameList([]), false), new lua.Chunk([])),
        ),
      );

      assert.strictEqual(await generator.generate(), 'function()\nend');
    });
    it('should generate a parenthesised prefix expression', async () => {
      const generator = new SourceGenerator(new lua.ParenthesisedPrefixExpression(new lua.TrueExpression()));

      assert.strictEqual(await generator.generate(), '(true)');
    });
    it('should generate a table constructor expression', async () => {
      const generator = new SourceGenerator(new lua.TableConstructorExpression([]));

      assert.strictEqual(await generator.generate(), '{}');
    });
  });

  describe('generatePrefixExpression', () => {
    it('should generate a method function call', async () => {
      const generator = new SourceGenerator(
        new lua.MethodFunctionCall(
          new lua.NameVariable(new lua.Name('test')),
          new lua.Name('test'),
          new lua.ExpressionListArguments(new lua.ExpressionList([])),
        ),
      );

      assert.strictEqual(await generator.generate(), 'test:test()');
    });

    it('should generate a normal function call', async () => {
      const generator = new SourceGenerator(
        new lua.NormalFunctionCall(
          new lua.NameVariable(new lua.Name('test')),
          new lua.ExpressionListArguments(new lua.ExpressionList([])),
        ),
      );

      assert.strictEqual(await generator.generate(), 'test()');
    });

    it('should generate a normal function call with table arguments', async () => {
      const generator = new SourceGenerator(
        new lua.NormalFunctionCall(
          new lua.NameVariable(new lua.Name('test')),
          new lua.TableConstructorArguments(
            new lua.TableConstructorExpression([new lua.FieldArrayKey(new lua.TrueExpression())]),
          ),
        ),
      );

      assert.strictEqual(await generator.generate(), 'test{\n  true,\n}');
    });

    it('should generate a normal function call with string argument', async () => {
      const generator = new SourceGenerator(
        new lua.NormalFunctionCall(
          new lua.NameVariable(new lua.Name('test')),
          new lua.StringArguments(new lua.StringExpression('"test"', 'test')),
        ),
      );

      assert.strictEqual(await generator.generate(), 'test"test"');
    });

    it('should generate an indexed variable', async () => {
      const generator = new SourceGenerator(
        new lua.IndexedVariable(new lua.NameVariable(new lua.Name('test')), new lua.TrueExpression()),
      );

      assert.strictEqual(await generator.generate(), 'test[true]');
    });

    it('should generate a member variable', async () => {
      const generator = new SourceGenerator(
        new lua.MemberVariable(new lua.NameVariable(new lua.Name('test')), new lua.Name('test')),
      );

      assert.strictEqual(await generator.generate(), 'test.test');
    });

    it('should generate a name variable', async () => {
      const generator = new SourceGenerator(new lua.NameVariable(new lua.Name('test')));

      assert.strictEqual(await generator.generate(), 'test');
    });

    it('should generate a function call statement', async () => {
      const generator = new SourceGenerator(
        new lua.FunctionCallStatement(
          new lua.NormalFunctionCall(
            new lua.NameVariable(new lua.Name('test')),
            new lua.ExpressionListArguments(new lua.ExpressionList([])),
          ),
        ),
      );

      assert.strictEqual(await generator.generate(), 'test()');
    });

    it('should generate a binary operation expression', async () => {
      const generator = new SourceGenerator(
        new lua.BinaryOperationExpression(new lua.TrueExpression(), '+', new lua.TrueExpression()),
      );

      assert.strictEqual(await generator.generate(), 'true + true');
    });

    it('should generate a unary operation expression', async () => {
      const generator = new SourceGenerator(new lua.UnaryOperationExpression('-', new lua.TrueExpression()));

      assert.strictEqual(await generator.generate(), '-true');
    });

    it('should generate a variable list', async () => {
      const generator = new SourceGenerator(new lua.VariableList([new lua.NameVariable(new lua.Name('test'))]));

      assert.strictEqual(await generator.generate(), 'test');
    });
  });
});
