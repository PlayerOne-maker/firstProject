import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { AppContext, LevelOptions, RoleOptions, StatusOption } from '../types'
import { isAuth } from '../utils/authhandle'

import { Typeleave, TypeleaveModel } from '../entities/Typeleave'
import { ResMessage } from './authresolvers'
import { Leave, LeaveModel } from '../entities/Leave'
import { UserModel } from '../entities/User'
import { RequsetLeave, RequsetLeaveModel } from '../entities/Requestleave'
import { DepartmentModel } from '../entities/department'

@Resolver()
export class leaveresolver {
    @Query(() => [Typeleave], { nullable: 'items' })
    async typeleave(
        @Ctx() { req }: AppContext
    ): Promise<Typeleave[] | null> {
        try {

            const user = isAuth(req)

            if (!user) throw Error("You must Login")

            const Typeleave = TypeleaveModel.find()

            return Typeleave

        } catch (error) {
            throw error
        }
    }

    @Mutation(() => ResMessage, { nullable: true })
    async addtypeleave(
        @Arg('name') name: string,
        @Arg('max') max: number,
        @Ctx() { req }: AppContext
    ): Promise<ResMessage | null> {
        try {
            const user = await isAuth(req)

            if (!(user.role.includes(RoleOptions.superadmin))) throw Error("You are not permission!!!")

            const check = await TypeleaveModel.findOne({ name })

            if (check) throw Error("Duplicate Data")

            const newType = await TypeleaveModel.create({
                name,
                max
            })

            await newType.save()

            return { message: "Success !!!" }
        } catch (error) {
            throw error
        }
    }

    @Mutation(() => Typeleave, { nullable: true })
    async updatetypeleave(
        @Arg('name') name: string,
        @Arg('max') max: number,
        @Arg('id') id: string,
        @Ctx() { req }: AppContext
    ): Promise<Typeleave | null> {
        try {
            const user = await isAuth(req)

            if (!(user.role.includes(RoleOptions.superadmin))) throw Error("You are not permission!!!")

            const check_id = await TypeleaveModel.findById(id)

            if (!check_id) throw Error("Not found")

            if (check_id.name === name) {

                check_id.max = max

                await check_id.save()

                return check_id
            } else {

                const check_name = await TypeleaveModel.findOne({ name })

                if (check_name) throw Error("Duplicate")

                check_id.name = name

                check_id.max = max

                await check_id.save()

                return check_id
            }

        } catch (error) {
            throw error
        }
    }

    @Mutation(() => ResMessage, { nullable: true })
    async deletetypeleave(
        @Arg('id') id: string,
        @Ctx() { req }: AppContext
    ): Promise<ResMessage | null> {
        try {
            const user = await isAuth(req)

            if (!(user.role.includes(RoleOptions.superadmin))) throw Error("You are not permission!!!")

            const check_id = await TypeleaveModel.findById(id)

            if (!check_id) throw Error("Not found")

            const del = await TypeleaveModel.findByIdAndDelete(id)

            if (!del) throw Error("Someting went worng!!!")

            return { message: "success" }

        } catch (error) {
            throw error
        }
    }

    @Mutation(() => Leave, { nullable: true })
    async addleave(
        @Ctx() { req }: AppContext,
        @Arg('userId') userId: string,
        @Arg('typeleaveId') typeleaveId: string,
        @Arg('count') count: number
    ): Promise<Leave | null> {
        try {
            const admin = await isAuth(req)

            if (!(admin.role.includes(RoleOptions.admin) || admin.role.includes(RoleOptions.superadmin))) throw Error("You are not permission!!!")

            const check_user = await UserModel.findById(userId)

            if (!check_user) throw Error("User not found !!!")

            const check_Leave = await TypeleaveModel.findById(typeleaveId)

            if (!check_Leave) throw Error("Typeleave not found !!!")

            const check_Leave_dup = await LeaveModel.findOne({ "typeleave": Object(typeleaveId) })

            const check_User_dup = await LeaveModel.findOne({ "user": Object(userId) })

            if (count > check_Leave.max) count = check_Leave.max

            if (check_Leave_dup && check_User_dup) {

                const findIndexLeave = await LeaveModel.findById(check_User_dup.id)
                    .populate({ path: 'typeleave' }).populate({ path: 'user' })

                if (!findIndexLeave) throw Error("Not Found.")

                findIndexLeave.count = count

                findIndexLeave.typeleave = check_Leave

                findIndexLeave.user = check_user

                await findIndexLeave.save()

                return findIndexLeave

            } else {

                const newLeave = await LeaveModel.create({
                    count,
                    typeleave: check_Leave,
                    user: check_user
                })

                return newLeave
            }


        } catch (error) {
            throw error
        }
    }
    @Mutation(() => ResMessage, { nullable: true })
    async deleteleave(
        @Arg('id') id: string,
        @Ctx() { req }: AppContext
    ): Promise<ResMessage | null> {
        try {
            const admin = await isAuth(req)

            if (!(admin.role.includes(RoleOptions.admin) || admin.role.includes(RoleOptions.superadmin))) throw Error("You are not permission!!!")

            const check_id = await LeaveModel.findById(id)

            if (!check_id) throw Error("Not found")

            const del = await TypeleaveModel.findByIdAndDelete(id)

            if (!del) throw Error("Someting went worng!!!")

            return { message: "success" }

        } catch (error) {
            throw error
        }
    }

    @Mutation(() => RequsetLeave, { nullable: true })
    async requestleave(
        @Arg('from') from: Date,
        @Arg('to') to: Date,
        @Arg('descriptionfrom') descriptionfrom: string,
        @Arg('descriptionto') descriptionto: string,
        @Arg('typeleaveId') typeleaveId: string,
        @Ctx() { req }: AppContext,
    ): Promise<RequsetLeave | null> {
        try {

            const check_user = await isAuth(req)

            if (!check_user) throw Error("User not found")

            const check_type = await TypeleaveModel.findById(typeleaveId)

            if (!check_type) throw Error("Type not found")

            const Different = (to.getTime() - from.getTime()) / (1000 * 3600 * 24)

            const findIndexLeave = await LeaveModel.findOne({ "user": Object(check_user.id) })
                .populate({ path: 'typeleave' }).populate({ path: 'user' })

            if (!findIndexLeave) throw Error("Not Found.")

            findIndexLeave.count = findIndexLeave.count - Different

            findIndexLeave.save()

            const requsetleave = RequsetLeaveModel.create({
                descriptionfrom,
                descriptionto,
                typeleave: check_type,
                user: check_user,
                from,
                to
            })

            return requsetleave

        } catch (error) {
            throw error
        }
    }

    @Mutation(() => RequsetLeave, { nullable: true })
    async submitleaveByleader(
        @Arg('id') id: string,
        @Arg('Status') Status: StatusOption,
        @Ctx() { req }: AppContext,
    ): Promise<RequsetLeave | null> {
        try {

            const check_user = await isAuth(req)

            if (!check_user) throw Error("User not found")

            const check_leave = await RequsetLeaveModel.findById(id)

            if (!check_leave) throw Error("Not Found")

            const check_user_leave = await UserModel.findById(check_leave.user).populate({ path: 'department' })

            const check_User_department = await DepartmentModel.findById(check_user.department)

            const check_User_leave_department = await DepartmentModel.findById(check_user_leave?.department)

            if (check_User_department?.id !== check_User_leave_department?.id) throw Error("can't appove")

            if(check_user?.level.includes(LevelOptions.midlevel)){
                if(!check_user_leave?.level.includes(LevelOptions.operationlevel)) throw Error("You can't appove because diferent Leave")
            }
    
            if(check_user?.level.includes(LevelOptions.toplevel)){
                if(!check_user_leave?.level.includes(LevelOptions.midlevel)) throw Error("You can't appove because diferent Leave")
            }

            if(check_leave.leader.includes(StatusOption.appove) || check_leave.leader.includes(StatusOption.reject) ) throw Error("You can't submit again")

            check_leave.leader = Status

            check_leave.leaderBy = check_user

            await check_leave.save()

            return check_leave

        } catch (error) {
            throw error
        }
    }

    @Mutation(() => RequsetLeave, { nullable: true })
    async submitleaveByhr(
        @Arg('id') id: string,
        @Arg('Status') Status: StatusOption,
        @Ctx() { req }: AppContext,
    ): Promise<RequsetLeave | null> {
        try {

            const check_user = await isAuth(req)

            if (!check_user) throw Error("User not found")

            const check_dapartment = await DepartmentModel.findOne({name:'HR'})

            const check_User_department = await DepartmentModel.findById(check_user.department)

            if(check_User_department?.id !== check_dapartment?.id) throw Error ("You not have permission")

            const check_leave = await RequsetLeaveModel.findById(id).populate({path: 'user'}).populate({path: 'leaderBy'})

            if (!check_leave) throw Error("Not Found")

            if(check_leave.hr.includes(StatusOption.appove) || check_leave.hr.includes(StatusOption.reject) ) throw Error("You can't submit again")

            check_leave.hr = Status

            check_leave.hrBy = check_user

            await check_leave.save()

            return check_leave

        } catch (error) {
            throw error
        }
    }
}
