'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useForm } from 'react-hook-form';

import { getAuthToken } from '@/lib/utils/auth';

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
    onSelectAddress: (address: Address) => void;
}) {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const { register, handleSubmit, reset } = useForm();

    const token = getAuthToken();
    const fetchAddresses = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/address/`, {
                headers: {
                    Authorization: `Bearer ${token}`,

                },
            });

            if (!res.ok) throw new Error('Failed to fetch addresses');

            const data = await res.json();
            setAddresses(data);

            const defaultAddress = data.find((a: Address) => a.isDefault);
            if (defaultAddress) {
                setSelectedAddressId(defaultAddress.id);
                onSelectAddress(defaultAddress);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const handleAddressSelect = (address: Address) => {
        setSelectedAddressId(address.id);
        onSelectAddress(address);
    };

    const onSubmit = async (formData: any) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/address`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Failed to save address');

            setShowForm(false);
            reset();
            fetchAddresses();
        } catch (err) {
            console.error(err);
            alert('Failed to save address');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Select Delivery Address</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((address) => (
                    <div
                        key={address.id}
                        className={clsx(
                            'border p-4 rounded cursor-pointer',
                            selectedAddressId === address.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        )}
                        onClick={() => handleAddressSelect(address)}
                    >
                        <p className="font-medium">{address.fullName}</p>
                        <p>{address.phone}</p>
                        <p>
                            {address.line1}, {address.line2 && `${address.line2}, `}
                            {address.city}, {address.state}, {address.country} - {address.postalCode}
                        </p>
                        {address.isDefault && <p className="text-green-600 text-sm mt-1">Default Address</p>}
                    </div>
                ))}
            </div>

            <button
                className="text-blue-600 underline mt-2"
                onClick={() => setShowForm((prev) => !prev)}
            >
                {showForm ? 'Cancel' : 'Add New Address'}
            </button>

            {showForm && (
                <div className="grid grid-cols-1 gap-3">
                    <input {...register('fullName')} placeholder="Full Name" required className="input" />
                    <input {...register('phone')} placeholder="Phone" required className="input" />
                    <input {...register('altPhone')} placeholder="Alternate Phone" className="input" />
                    <input {...register('line1')} placeholder="Address Line 1" required className="input" />
                    <input {...register('line2')} placeholder="Address Line 2" className="input" />
                    <input {...register('city')} placeholder="City" required className="input" />
                    <input {...register('state')} placeholder="State" required className="input" />
                    <input {...register('country')} placeholder="Country" required className="input" />
                    <input {...register('postalCode')} placeholder="Postal Code" required className="input" />
                    <label className="flex items-center gap-2">
                        <input type="checkbox" {...register('isDefault')} />
                        Set as default address
                    </label>
                    <button
                        type="button"
                        onClick={handleSubmit(onSubmit)}
                        className="bg-black text-white py-2 rounded"
                    >
                        Save Address
                    </button>
                </div>
            )}

        </div>
    );
}
