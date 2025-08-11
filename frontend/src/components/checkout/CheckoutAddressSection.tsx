'use client';

import { useEffect, useState, Fragment } from 'react';
import clsx from 'clsx';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { fetchWrapper } from '@/lib/api/fetchWrapper';
import { toast, Toaster } from 'sonner';
import { Plus, Check, Loader2, Home, Trash2, X } from 'lucide-react';
import { Source_Sans_3 } from 'next/font/google';

const sourceSansPro = Source_Sans_3({ subsets: ['latin'], weight: ['400', '600'] });

const addressSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name is too long'),
    phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number (10-15 digits)'),
    altPhone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid alternate phone number').optional(),
    line1: z.string().min(5, 'Address line 1 must be at least 5 characters').max(200, 'Address line 1 is too long'),
    line2: z.string().max(200, 'Address line 2 is too long').optional(),
    city: z.string().min(2, 'City must be at least 2 characters').max(100, 'City is too long'),
    state: z.string().min(2, 'State must be at least 2 characters').max(100, 'State is too long'),
    country: z.string().min(2, 'Country must be at least 2 characters').max(100, 'Country is too long'),
    postalCode: z
        .string()
        .regex(/^\d{6}$/, 'Postal code must be a 6-digit number (India)')
        .min(6, 'Postal code must be 6 digits')
        .max(6, 'Postal code must be 6 digits'),
    isDefault: z.boolean(),
});

type AddressFormType = z.infer<typeof addressSchema>;

type Address = {
    id: string;
    fullName: string;
    phone: string;
    altPhone?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    isDefault: boolean;
};

export default function CheckoutAddressSection({
    onSelectAddress,
}: {
    onSelectAddress: (address: Address | null) => void;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AddressFormType>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            fullName: '',
            phone: '',
            altPhone: '',
            line1: '',
            line2: '',
            city: '',
            state: '',
            country: 'India',
            postalCode: '',
            isDefault: false,
        },
    });

    useEffect(() => {
        if (status === 'unauthenticated') {
            toast.error('Please login to view addresses');
            router.push('/login?redirect=/checkout');
            return;
        }
        if (status === 'authenticated') {
            fetchAddresses();
        }
    }, [status, router]);

    const fetchAddresses = async () => {
        setIsLoading(true);
        try {
            const data = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/address`);
            const fetchedAddresses = data.addresses || data;
            setAddresses(fetchedAddresses);
            const defaultAddress = fetchedAddresses.find((a: Address) => a.isDefault);
            if (defaultAddress) {
                setSelectedAddressId(defaultAddress.id);
                onSelectAddress(defaultAddress);
            } else if (fetchedAddresses.length > 0) {
                setSelectedAddressId(fetchedAddresses[0].id);
                onSelectAddress(fetchedAddresses[0]);
            } else {
                setSelectedAddressId(null);
                onSelectAddress(null);
            }
        } catch (err: any) {
            console.error('Fetch error:', err.message);
            toast.error(err.message || 'Could not load addresses. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit: SubmitHandler<AddressFormType> = async (formData) => {
        setIsSaving(true);
        try {
            await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/address`, {
                method: 'POST',
                body: JSON.stringify(formData),
            });
            setShowForm(false);
            reset();
            fetchAddresses();
            toast.success('Address saved successfully!');
        } catch (err: any) {
            console.error('Save error:', err.message);
            toast.error(err.message || 'Failed to save address. Please check your inputs.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAddress = async () => {
        if (!addressToDelete) return;
        setDeletingId(addressToDelete.id);
        try {
            await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/address/${addressToDelete.id}`, {
                method: 'DELETE',
            });
            setAddressToDelete(null);
            toast.success('Address deleted successfully!');
            if (selectedAddressId === addressToDelete.id) {
                setSelectedAddressId(null);
                onSelectAddress(null);
            }
            fetchAddresses();
        } catch (err: any) {
            console.error('Delete error:', err.message);
            toast.error(err.message || 'Failed to delete address.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleAddressSelect = (address: Address) => {
        setSelectedAddressId(address.id);
        onSelectAddress(address);
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Home className="w-5 h-5 text-gray-700" />
                    <h2 className={`${sourceSansPro.className} text-xl font-bold text-gray-900`}>
                        Select Delivery Address
                    </h2>
                </div>
                <button
                    type="button"
                    className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-500"
                    onClick={() => {
                        setShowForm((prev) => !prev);
                        reset();
                    }}
                >
                    <Plus className="h-4 w-4" />
                    {showForm ? 'Cancel' : 'Add New Address'}
                </button>
            </div>

            {addresses.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                    <p className={`${sourceSansPro.className} text-gray-500`}>
                        You don't have any saved addresses yet. Add one below!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                        <div
                            key={address.id}
                            className={clsx(
                                'relative p-5 rounded-xl border-1 cursor-pointer transition-all',
                                'hover:border-slate-300',
                                selectedAddressId === address.id ? 'border-black ring-black' : 'border-gray-200'
                            )}
                            onClick={() => handleAddressSelect(address)}
                        >
                            {selectedAddressId === address.id && (
                                <div className="absolute top-3 right-3 text-green-600">
                                    <Check className="h-5 w-5" />
                                </div>
                            )}
                            <button
                                type="button"
                                className="absolute top-3 left-3 text-red-500 hover:text-red-700 transition-colors z-10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setAddressToDelete(address);
                                }}
                            >
                                {deletingId === address.id ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Trash2 className="h-5 w-5" />
                                )}
                            </button>
                            <p className="font-semibold text-gray-900 mt-6">{address.fullName}</p>
                            <p className="text-sm text-gray-600 mt-1">{address.phone}</p>
                            <p className="text-sm text-gray-600 mt-2">
                                {address.line1}, {address.line2 && `${address.line2}, `}
                                {address.city}, {address.state}, {address.country} - {address.postalCode}
                            </p>
                            {address.isDefault && (
                                <p className="text-xs text-green-600 font-medium mt-2 bg-green-100 px-2 py-0.5 inline-block rounded-full">
                                    Default
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="bg-gray-50 p-6 rounded-xl space-y-4 transition-all mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-full">
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                                Full Name
                            </label>
                            <input
                                id="fullName"
                                {...register('fullName')}
                                placeholder="John Doe"
                                className="w-full p-3 border border-gray-300 rounded-md text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
                            />
                            {errors.fullName && <p className="text-red-500 text-xs mt-1 font-medium">{String(errors.fullName.message)}</p>}
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                Phone
                            </label>
                            <input
                                id="phone"
                                {...register('phone')}
                                placeholder="Phone"
                                className="w-full p-3 border border-gray-300 rounded-md text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
                            />
                            {errors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{String(errors.phone.message)}</p>}
                        </div>
                        <div>
                            <label htmlFor="altPhone" className="block text-sm font-medium text-gray-700">
                                Alternate Phone (Optional)
                            </label>
                            <input
                                id="altPhone"
                                {...register('altPhone')}
                                placeholder="Alternate Phone"
                                className="w-full p-3 border border-gray-300 rounded-md text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
                            />
                            {errors.altPhone && <p className="text-red-500 text-xs mt-1 font-medium">{String(errors.altPhone.message)}</p>}
                        </div>
                        <div className="col-span-full">
                            <label htmlFor="line1" className="block text-sm font-medium text-gray-700">
                                Address Line 1
                            </label>
                            <input
                                id="line1"
                                {...register('line1')}
                                placeholder="1234 Main St"
                                className="w-full p-3 border border-gray-300 rounded-md text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
                            />
                            {errors.line1 && <p className="text-red-500 text-xs mt-1 font-medium">{String(errors.line1.message)}</p>}
                        </div>
                        <div className="col-span-full">
                            <label htmlFor="line2" className="block text-sm font-medium text-gray-700">
                                Address Line 2 (Optional)
                            </label>
                            <input
                                id="line2"
                                {...register('line2')}
                                placeholder="Apartment, suite, etc."
                                className="w-full p-3 border border-gray-300 rounded-md text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
                            />
                            {errors.line2 && <p className="text-red-500 text-xs mt-1 font-medium">{String(errors.line2.message)}</p>}
                        </div>
                        <div>
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                                City
                            </label>
                            <input
                                id="city"
                                {...register('city')}
                                placeholder="Your city"
                                className="w-full p-3 border border-gray-300 rounded-md text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
                            />
                            {errors.city && <p className="text-red-500 text-xs mt-1 font-medium">{String(errors.city.message)}</p>}
                        </div>
                        <div>
                            <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                                State
                            </label>
                            <input
                                id="state"
                                {...register('state')}
                                placeholder="Your state"
                                className="w-full p-3 border border-gray-300 rounded-md text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
                            />
                            {errors.state && <p className="text-red-500 text-xs mt-1 font-medium">{String(errors.state.message)}</p>}
                        </div>
                        <div>
                            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                                Country
                            </label>
                            <input
                                id="country"
                                {...register('country')}
                                placeholder="India"
                                className="w-full p-3 border border-gray-300 rounded-md text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
                            />
                            {errors.country && <p className="text-red-500 text-xs mt-1 font-medium">{String(errors.country.message)}</p>}
                        </div>
                        <div>
                            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                                Postal Code
                            </label>
                            <input
                                id="postalCode"
                                {...register('postalCode')}
                                placeholder="eg: 100012"
                                className="w-full p-3 border border-gray-300 rounded-md text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors"
                            />
                            {errors.postalCode && <p className="text-red-500 text-xs mt-1 font-medium">{String(errors.postalCode.message)}</p>}
                        </div>
                    </div>
                    <label className="flex items-center gap-2 mt-4">
                        <input
                            type="checkbox"
                            {...register('isDefault')}
                            className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                        />
                        <span className="text-sm text-gray-900">Set as default address</span>
                    </label>
                    <button
                        type="button"
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSaving}
                        className="w-full bg-black text-white py-3 rounded-md mt-4 text-sm font-semibold tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
                    >
                        {isSaving ? (
                            <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                        ) : (
                            'Save Address'
                        )}
                    </button>
                </div>
            )}

            {addressToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                        <p className="text-sm text-gray-600 mt-2">
                            Are you sure you want to delete this address? This action cannot be undone.
                        </p>
                        <div className="mt-4 flex gap-3 justify-end">
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                                onClick={() => setAddressToDelete(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                                onClick={handleDeleteAddress}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <Toaster />
        </div>
    );
}