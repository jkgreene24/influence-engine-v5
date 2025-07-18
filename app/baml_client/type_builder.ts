/*************************************************************************************************

Welcome to Baml! To use this generated code, please run one of the following:

$ npm install @boundaryml/baml
$ yarn add @boundaryml/baml
$ pnpm add @boundaryml/baml

*************************************************************************************************/

// This file was generated by BAML: do not edit it. Instead, edit the BAML
// files and re-generate this code.
//
/* eslint-disable */
// tslint:disable
// @ts-nocheck
// biome-ignore format: autogenerated code
import { FieldType } from '@boundaryml/baml/native'
import { TypeBuilder as _TypeBuilder, EnumBuilder, EnumViewer, ClassBuilder, ClassViewer } from '@boundaryml/baml/type_builder'
import { DO_NOT_USE_DIRECTLY_UNLESS_YOU_KNOW_WHAT_YOURE_DOING_RUNTIME } from "./globals"

export default class TypeBuilder {
    private tb: _TypeBuilder;
    
    Message: ClassViewer<'Message', "role" | "content">;
    
    ResponseChat: ClassBuilder<'ResponseChat', "answer">;
    
    SwitchInfluenceStyle: ClassViewer<'SwitchInfluenceStyle', "name" | "influence_style">;
    
    UserMetadata: ClassViewer<'UserMetadata', "name" | "influence_style">;
    
    

    constructor() {
        this.tb = new _TypeBuilder({
          classes: new Set([
            "Message","ResponseChat","SwitchInfluenceStyle","UserMetadata",
          ]),
          enums: new Set([
            
          ]),
          runtime: DO_NOT_USE_DIRECTLY_UNLESS_YOU_KNOW_WHAT_YOURE_DOING_RUNTIME
        });
        
        this.Message = this.tb.classViewer("Message", [
          "role","content",
        ]);
        
        this.ResponseChat = this.tb.classBuilder("ResponseChat", [
          "answer",
        ]);
        
        this.SwitchInfluenceStyle = this.tb.classViewer("SwitchInfluenceStyle", [
          "name","influence_style",
        ]);
        
        this.UserMetadata = this.tb.classViewer("UserMetadata", [
          "name","influence_style",
        ]);
        
        
    }

    __tb() {
      return this.tb._tb();
    }

    string(): FieldType {
        return this.tb.string()
    }

    literalString(value: string): FieldType {
        return this.tb.literalString(value)
    }

    literalInt(value: number): FieldType {
        return this.tb.literalInt(value)
    }

    literalBool(value: boolean): FieldType {
        return this.tb.literalBool(value)
    }

    int(): FieldType {
        return this.tb.int()
    }

    float(): FieldType {
        return this.tb.float()
    }

    bool(): FieldType {
        return this.tb.bool()
    }

    list(type: FieldType): FieldType {
        return this.tb.list(type)
    }

    null(): FieldType {
        return this.tb.null()
    }

    map(key: FieldType, value: FieldType): FieldType {
        return this.tb.map(key, value)
    }

    union(types: FieldType[]): FieldType {
        return this.tb.union(types)
    }

    addClass<Name extends string>(name: Name): ClassBuilder<Name> {
        return this.tb.addClass(name);
    }

    addEnum<Name extends string>(name: Name): EnumBuilder<Name> {
        return this.tb.addEnum(name);
    }

    addBaml(baml: string): void {
        this.tb.addBaml(baml);
    }
}