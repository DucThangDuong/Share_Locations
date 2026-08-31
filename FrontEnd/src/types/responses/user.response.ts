import type { UserDto, UserProfileData } from '../models/user.model'
import type { ApiSuccessResponse } from './common.response'

export type UserProfileResponse = ApiSuccessResponse<UserProfileData>
export type UserSummaryResponse = ApiSuccessResponse<UserDto>
