"use strict";
/**
 * Core type definitions for RCA Agent
 *
 * This file contains all shared interfaces and types used throughout the system.
 * Following single source of truth principle for type definitions.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.AnalysisTimeoutError = exports.LLMError = exports.ParsingError = void 0;
/**
 * Error thrown when parsing fails
 */
var ParsingError = /** @class */ (function (_super) {
    __extends(ParsingError, _super);
    function ParsingError(message, errorText, language) {
        var _this = _super.call(this, message) || this;
        _this.errorText = errorText;
        _this.language = language;
        _this.name = 'ParsingError';
        return _this;
    }
    return ParsingError;
}(Error));
exports.ParsingError = ParsingError;
/**
 * Error thrown when LLM operation fails
 */
var LLMError = /** @class */ (function (_super) {
    __extends(LLMError, _super);
    function LLMError(message, statusCode, retryable) {
        if (retryable === void 0) { retryable = true; }
        var _this = _super.call(this, message) || this;
        _this.statusCode = statusCode;
        _this.retryable = retryable;
        _this.name = 'LLMError';
        return _this;
    }
    return LLMError;
}(Error));
exports.LLMError = LLMError;
/**
 * Error thrown when analysis times out
 */
var AnalysisTimeoutError = /** @class */ (function (_super) {
    __extends(AnalysisTimeoutError, _super);
    function AnalysisTimeoutError(message, iteration, maxIterations) {
        var _this = _super.call(this, message) || this;
        _this.iteration = iteration;
        _this.maxIterations = maxIterations;
        _this.name = 'AnalysisTimeoutError';
        return _this;
    }
    return AnalysisTimeoutError;
}(Error));
exports.AnalysisTimeoutError = AnalysisTimeoutError;
/**
 * Error thrown when input validation fails
 */
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'ValidationError';
        return _this;
    }
    return ValidationError;
}(Error));
exports.ValidationError = ValidationError;
