"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageController = void 0;
const common_1 = require("@nestjs/common");
const events_gateway_1 = require("../../gateways/events.gateway");
const image_1 = require("../../models/image");
const image_service_1 = require("../../services/image/image.service");
let ImageController = class ImageController {
    constructor(imageService, eventGateway) {
        this.imageService = imageService;
        this.eventGateway = eventGateway;
    }
    getAllImages() {
        return this.imageService.getAllImages();
    }
    uploadImage(image) {
        console.log(image);
        this.imageService.addImage(image);
        this.eventGateway.sendImage(image);
        return 'succes!';
    }
};
__decorate([
    (0, common_1.Get)('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ImageController.prototype, "getAllImages", null);
__decorate([
    (0, common_1.Post)('new'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [image_1.Image]),
    __metadata("design:returntype", void 0)
], ImageController.prototype, "uploadImage", null);
ImageController = __decorate([
    (0, common_1.Controller)('image'),
    __metadata("design:paramtypes", [image_service_1.ImageService, events_gateway_1.EventsGateway])
], ImageController);
exports.ImageController = ImageController;
//# sourceMappingURL=image.controller.js.map