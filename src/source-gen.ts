import { EventEmitter } from 'events';
import {
  Arguments,
  Expression,
  ExpressionType,
  FunctionCallPrefixExpression,
  Node,
  PrefixExpression,
  PrefixExpressionType,
  Statement,
  VariablePrefixExpression,
  StatementType,
  VariablePrefixExpressionType,
  FunctionCallPrefixExpressionType,
  ArgumentsType,
  NodeType,
  Field,
  FieldType,
} from '@meepen/luaparse';

export class SourceGenerator extends EventEmitter {
  constructor(
    public root: Node,
    public newLine = '\n',
    public tab = '  ',
  ) {
    super();
    if (root.type !== NodeType.Chunk) {
      this.indentLevel = 0;
    }
  }

  private indentLevel = -1;

  private line() {
    this.emitData(this.newLine + this.tab.repeat(this.indentLevel));
  }

  private emitData(data: string) {
    this.emit('data', data);
  }

  private async fromVariable(node: VariablePrefixExpression) {
    switch (node.variablePrefixExpressionType) {
      case VariablePrefixExpressionType.Name:
        this.emitData(node.name.name);
        break;
      case VariablePrefixExpressionType.Index:
        await this.fromPrefixExpression(node.base);
        this.emitData('[');
        await this.fromExpression(node.index);
        this.emitData(']');
        break;
      case VariablePrefixExpressionType.Member:
        await this.fromPrefixExpression(node.base);
        this.emitData('.');
        await this.from(node.member);
        break;
      default:
        throw new Error('not implemented');
    }
  }

  private async fromArguments(node: Arguments) {
    switch (node.argumentsType) {
      case ArgumentsType.ExpressionList:
        this.emitData('(');
        await this.from(node.expressions);
        this.emitData(')');
        break;
      case ArgumentsType.TableConstructor:
        await this.from(node.table);
        break;
      case ArgumentsType.String:
        await this.fromExpression(node.string);
        break;
      default:
        throw new Error('not implemented');
    }
  }

  private async fromFunctionCall(node: FunctionCallPrefixExpression) {
    switch (node.functionCallPrefixExpressionType) {
      case FunctionCallPrefixExpressionType.Normal:
        await this.fromPrefixExpression(node.functionExpression);
        await this.fromArguments(node.argument);
        break;
      case FunctionCallPrefixExpressionType.Method:
        await this.fromPrefixExpression(node.object);
        this.emitData(':');
        await this.from(node.name);
        await this.fromArguments(node.argument);
        break;
      default:
        throw new Error('not implemented');
    }
  }

  private async fromPrefixExpression(node: PrefixExpression) {
    switch (node.prefixExpressionType) {
      case PrefixExpressionType.Variable:
        await this.fromVariable(node);
        break;
      case PrefixExpressionType.FunctionCall:
        await this.fromFunctionCall(node);
        break;
      case PrefixExpressionType.ParenthesizedExpression:
        this.emitData('(');
        await this.fromExpression(node.expression);
        this.emitData(')');
        break;
      default:
        throw new Error('not implemented');
    }
  }

  private async fromExpression(node: Expression) {
    switch (node.expressionType) {
      case ExpressionType.UnaryOperationExpression:
        this.emitData(node.operator);
        await this.fromExpression(node.expression);
        break;
      case ExpressionType.PrefixExpression:
        await this.fromPrefixExpression(node);
        break;
      case ExpressionType.VarargExpression:
        this.emitData('...');
        break;
      case ExpressionType.NumberExpression:
        this.emitData(node.raw);
        break;
      case ExpressionType.NilExpression:
        this.emitData('nil');
        break;
      case ExpressionType.FalseExpression:
        this.emitData('false');
        break;
      case ExpressionType.TrueExpression:
        this.emitData('true');
        break;
      case ExpressionType.StringExpression:
        this.emitData('"');
        this.emitData(node.value.replace(/[\\\r\n"]/g, '\\$0'));
        this.emitData('"');
        break;
      case ExpressionType.BinaryOperationExpression:
        await this.fromExpression(node.leftExpression);
        this.emitData(' ');
        this.emitData(node.operator);
        this.emitData(' ');
        await this.fromExpression(node.rightExpression);
        break;
      case ExpressionType.FunctionExpression:
        this.emitData('function');
        await this.from(node.body);
        this.line();
        this.emitData('end');
        break;
      case ExpressionType.TableConstructorExpression:
        this.emitData('{');
        this.indentLevel++;
        for (const field of node.fields) {
          this.line();
          await this.from(field);
          this.emitData(',');
        }
        this.indentLevel--;
        if (node.fields.length > 0) {
          this.line();
        }
        this.emitData('}');
        break;
      default:
        throw new Error('not implemented');
    }
  }

  private async fromStatement(node: Statement) {
    switch (node.statementType) {
      case StatementType.FunctionDeclaration:
        this.emitData('function ');
        await this.from(node.name);
        await this.from(node.body);
        this.line();
        this.emitData('end');
        break;

      case StatementType.IfBlockEnd:
        this.emitData('if ');
        await this.fromExpression(node.condition);
        this.emitData(' then');
        await this.from(node.body);
        for (const elseIf of node.elseIfs) {
          this.line();
          this.emitData('elseif ');
          await this.fromExpression(elseIf.condition);
          this.emitData(' then');
          await this.from(elseIf.body);
        }
        if (node.elseBody) {
          this.line();
          this.emitData('else');
          await this.from(node.elseBody);
        }
        this.line();
        this.emitData('end');
        break;

      case StatementType.ForDoBlockEnd:
        this.emitData('for ');
        await this.from(node.varName);
        this.emitData(' = ');
        await this.fromExpression(node.startExpression);
        this.emitData(', ');
        await this.fromExpression(node.endExpression);
        if (node.stepExpression) {
          this.emitData(', ');
          await this.fromExpression(node.stepExpression);
        }
        this.emitData(' do');
        await this.from(node.body);
        this.line();
        this.emitData('end');
        break;

      case StatementType.FunctionCall:
        await this.fromPrefixExpression(node.expression);
        break;

      case StatementType.ReturnStatement:
        this.emitData('return');
        if (node.expressions.children.length > 0) {
          this.emitData(' ');
          await this.from(node.expressions);
        }
        break;

      case StatementType.LocalVariableDeclaration:
        this.emitData('local ');
        await this.from(node.names);
        if (node.expressions) {
          this.emitData(' = ');
          await this.from(node.expressions);
        }
        break;

      case StatementType.Assignment:
        await this.from(node.variables);
        this.emitData(' = ');
        await this.from(node.expressions);
        break;

      case StatementType.DoBlockEnd:
        this.emitData('do');
        await this.from(node.body);
        this.line();
        this.emitData('end');
        break;

      case StatementType.LocalFunctionDeclaration:
        this.emitData('local function ');
        await this.from(node.name);
        await this.from(node.body);
        this.line();
        this.emitData('end');
        break;

      case StatementType.BreakStatement:
        this.emitData('break');
        break;

      case StatementType.ForInBlockEnd:
        this.emitData('for ');
        await this.from(node.nameList);
        this.emitData(' in ');
        await this.from(node.expressionList);
        this.emitData(' do');
        await this.from(node.body);
        this.line();
        this.emitData('end');
        break;

      case StatementType.RepeatBlockEnd:
        this.emitData('repeat');
        await this.from(node.body);
        this.line();
        this.emitData('until ');
        await this.fromExpression(node.condition);
        break;

      case StatementType.WhileBlockEnd:
        this.emitData('while ');
        await this.fromExpression(node.condition);
        this.emitData(' do');
        await this.from(node.body);
        this.line();
        this.emitData('end');
        break;

      default:
        throw new Error('not implemented');
    }
  }

  private async from(node: Node) {
    switch (node.type) {
      case NodeType.Chunk:
        this.indentLevel++;
        for (const statement of node.body) {
          this.line();
          await this.fromStatement(statement);
        }
        this.indentLevel--;
        break;

      case NodeType.FuncBody:
        await this.from(node.parameterList);
        await this.from(node.body);
        break;

      case NodeType.NameList:
        for (let i = 0; i < node.names.length; i++) {
          const name = node.names[i];
          this.emitData(name.name);
          if (i !== node.names.length - 1) {
            this.emitData(', ');
          }
        }
        break;

      case NodeType.Name:
        this.emitData(node.name);
        break;

      case NodeType.FunctionName:
        await this.from(node.name);
        for (const name of node.indexers) {
          this.emitData('.');
          await this.from(name);
        }
        if (node.methodName) {
          this.emitData(':');
          await this.from(node.methodName);
        }
        break;

      case NodeType.ParameterList:
        this.emitData('(');
        await this.from(node.namesList);
        if (node.namesList.names.length > 0 && node.vararg) {
          this.emitData(', ...');
        } else if (node.vararg) {
          this.emitData('...');
        }
        this.emitData(')');
        break;

      case NodeType.ExpressionList:
        for (let i = 0; i < node.expressions.length; i++) {
          const expression = node.expressions[i];
          await this.fromExpression(expression);
          if (i !== node.expressions.length - 1) {
            this.emitData(', ');
          }
        }
        break;

      case NodeType.VariableList:
        for (let i = 0; i < node.variables.length; i++) {
          const variable = node.variables[i];
          await this.fromVariable(variable);
          if (i !== node.variables.length - 1) {
            this.emitData(', ');
          }
        }
        break;

      case NodeType.Expression:
        await this.fromExpression(node);
        break;

      case NodeType.Statement:
        await this.fromStatement(node);
        break;

      case NodeType.Arguments:
        await this.fromArguments(node);
        break;

      case NodeType.Field:
        await this.fromField(node);
        break;

      case NodeType.ElseIfClause:
        this.emitData('elseif ');
        await this.fromExpression(node.condition);
        this.emitData(' then');
        await this.from(node.body);
        break;

      default:
        throw new Error('not implemented');
    }
  }

  private async fromField(node: Field) {
    switch (node.fieldType) {
      case FieldType.Expression:
        await this.fromExpression(node.value);
        break;

      case FieldType.NameExpression:
        await this.from(node.key);
        this.emitData(' = ');
        await this.fromExpression(node.value);
        break;

      case FieldType.ExpressionExpression:
        this.emitData('[');
        await this.fromExpression(node.key);
        this.emitData('] = ');
        await this.fromExpression(node.value);
        break;

      default:
        throw new Error('not implemented');
    }
  }

  public async process() {
    this.emit('start');
    try {
      await this.from(this.root);
      this.emit('end');
    } catch (e) {
      this.emit('error', e);
    }
  }

  public async generate(): Promise<string> {
    const chunks: string[] = [];
    const eventListener = (data: string) => chunks.push(data);
    this.on('data', eventListener);
    await this.process();
    this.removeListener('data', eventListener);
    return chunks.join('');
  }
}
