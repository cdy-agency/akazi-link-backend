"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceMultipleFiles = exports.pushMultipleFiles = exports.updateSingleFileField = exports.parseMultipleFiles = exports.parseSingleFile = void 0;
const parseSingleFile = (input) => {
    if (!input)
        return undefined;
    if (typeof input === 'object' && input !== null && 'url' in input) {
        return input;
    }
    return undefined;
};
exports.parseSingleFile = parseSingleFile;
const parseMultipleFiles = (input) => {
    if (!input)
        return [];
    const arr = Array.isArray(input) ? input : [input];
    const files = [];
    for (const item of arr) {
        const f = (0, exports.parseSingleFile)(item);
        if (f)
            files.push(f);
    }
    return files;
};
exports.parseMultipleFiles = parseMultipleFiles;
const updateSingleFileField = async (model, id, path, file, select = '-password') => {
    if (!file) {
        throw Object.assign(new Error('No file uploaded'), { statusCode: 400 });
    }
    const update = { $set: { [path]: file } };
    const doc = await model.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select(select);
    return doc;
};
exports.updateSingleFileField = updateSingleFileField;
const pushMultipleFiles = async (model, id, path, files, select = '-password') => {
    if (!files.length) {
        throw Object.assign(new Error('No documents uploaded'), { statusCode: 400 });
    }
    const update = { $push: { [path]: { $each: files } } };
    const doc = await model.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select(select);
    return doc;
};
exports.pushMultipleFiles = pushMultipleFiles;
const replaceMultipleFiles = async (model, id, path, files, select = '-password') => {
    if (!files.length) {
        throw Object.assign(new Error('No documents provided'), { statusCode: 400 });
    }
    const update = { $set: { [path]: files } };
    const doc = await model.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select(select);
    return doc;
};
exports.replaceMultipleFiles = replaceMultipleFiles;
