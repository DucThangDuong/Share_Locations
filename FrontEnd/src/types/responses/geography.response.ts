import type { ProvinceDto, RegionDto } from '../models/geography.model'
import type { ApiSuccessResponse } from './common.response'

export type ProvinceResponse = ApiSuccessResponse<ProvinceDto[]>
export type RegionResponse = ApiSuccessResponse<RegionDto[]>
export type ProvinceDetailResponse = ApiSuccessResponse<ProvinceDto>
