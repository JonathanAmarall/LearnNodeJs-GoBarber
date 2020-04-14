import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt'
import Appointment from '../models/Appointment';
import User from "../models/User";
import File from '../models/File';
import Notification from '../schemas/Notification';
import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';

class AppointmentController{
    async index(req, res){
        const { page = 1 } = req.query;

        const appoiment = await Appointment.findAll({
            where : { user_id : req.userId,canceled_at: null },
            order: ['date'],
            attributes:['id', 'date'],
            limit: 20,
            offset: (page -1) * 20,
            include:[{
                model: User,
                as: 'provider',
                attributes: ['id', 'name'],
                include: [{
                    model: File,
                    as: 'avatar',
                    attributes: ['id','path', 'url']
                }]
            }]
        });
        return res.json(appoiment);
    }

    async store(req, res){
        const schema = Yup.object().shape({
            provider_id: Yup.number().required(),
            date: Yup.date().required()
        });
        if (!(await schema.isValid(req.body))) {
            return res.status(400)
                .json({ error : 'Validations fails.'})
        }

        const { provider_id, date } = req.body;

        // Check provivder_id is true

        const isProvider = await User.findOne({
            where: { id: provider_id, provider: true }
        });

        /*
            Verify can user auth its equal a provider_id
        */
        if (provider_id === req.userId) {
            return res.json({ error : 'Cannot create a schedule.'})
        }

        if (!isProvider) {
            return res
            .status(401)
            .json({ error : 'You can only create appoiments with Providers'});
        }
        /**
         * check for past date
         */
        const hourStart = startOfHour(parseISO(date));

        if (isBefore(hourStart, new Date())) {
            return res.status(400)
                .json({error: 'Past dates are not permited.'});
        }

        /**
         * check date availability
         */
        const checkAvailability = await Appointment.findOne({
            where: {
                provider_id,
                canceled_at: null,
                date: hourStart
            }
        });

        if (checkAvailability) {
            return res.status(400)
            .json({ error: 'Appoinment date is not available.'});
        }

        const appointment = await Appointment.create({
            user_id: req.userId,
            provider_id,
            date
        });

        /**
         * Notify appointment provider
         */
        const formattedDate = format(
            hourStart,
             "'dia' dd 'de' MMMM', às' H:mm'h'",
             {
                 locale: pt
             });

        const user = await User.findByPk(req.userId);

        await Notification.create({
            content: `Novo agendamento de ${user.name} para ${formattedDate}`,
            user: provider_id
        });

       return res.json(appointment);
    }

    async delete(req, res){
        const appointment = await Appointment.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'provider',
                    attributes: ['name', 'email']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['name']
                }
            ]
        });

        if (appointment.user_id !== req.userId) {
            return res.json({ error: "You don't have permission to cancel this appointment."});
        }

        /* remove hour in date */
        const dateWithSub = subHours(appointment.date, 2);

        if (isBefore(dateWithSub, new Date())) {
            return res.status(401)
            .json({ error: 'You can only cancel appointments 2 hours in advance.'});
        }

        appointment.canceled_at = new Date();

        (await appointment).save();

        await Queue.add(CancellationMail.key, {
            appointment,
        })

        return res.json(appointment);
    }

;}

export default new AppointmentController();
